from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx
import urllib.parse
import json
from app.database import get_db
from app import models, schemas
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import get_settings
from app.deps import get_current_user, get_optional_user

router = APIRouter(prefix="/auth", tags=["认证"])


@router.post("/register", response_model=schemas.Token)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    """用户注册"""
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="该邮箱已被注册")

    user = models.User(
        email=payload.email,
        name=payload.name,
        phone=payload.phone,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.post("/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """用户登录（支持记住我）"""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="邮箱或密码错误")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="账号已被禁用")

    settings = get_settings()
    if payload.remember:
        expire = timedelta(days=settings.ACCESS_TOKEN_REMEMBER_DAYS)
    else:
        expire = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": str(user.id)}, expires_delta=expire)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=schemas.UserOut)
def me(user: models.User = Depends(get_current_user)):
    """获取当前登录用户信息"""
    return user


@router.put("/me", response_model=schemas.UserOut)
def update_me(
    payload: schemas.UserProfileUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """更新当前用户信息"""
    if payload.name is not None:
        user.name = payload.name
    if payload.avatar is not None:
        user.avatar = payload.avatar
    if payload.bio is not None:
        user.bio = payload.bio
    db.commit()
    db.refresh(user)
    return user


def _github_token_url(code: str, settings) -> str:
    return (
        f"https://github.com/login/oauth/access_token"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&client_secret={settings.GITHUB_CLIENT_SECRET}"
        f"&code={code}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
    )


@router.get("/oauth/github/authorize")
def github_authorize():
    """返回 GitHub OAuth 授权 URL"""
    settings = get_settings()
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=503, detail="GitHub 登录未配置")
    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&redirect_uri={settings.GITHUB_REDIRECT_URI}"
        f"&scope=user:email"
    )
    return {"url": url}


@router.get("/oauth/github/callback")
def github_callback(code: str, request: Request, db: Session = Depends(get_db)):
    """GitHub OAuth 回调：创建/登录用户后跳回前端"""
    settings = get_settings()
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="GitHub 登录未配置")

    try:
        # 1. 用 code 换 access_token
        token_resp = httpx.post(
            _github_token_url(code, settings),
            headers={"Accept": "application/json"},
            timeout=20,
        )
        token_resp.raise_for_status()
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="GitHub 授权失败")

        # 2. 获取用户资料
        headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
        user_resp = httpx.get("https://api.github.com/user", headers=headers, timeout=20)
        user_resp.raise_for_status()
        github_user = user_resp.json()
        github_id = str(github_user.get("id"))
        name = github_user.get("name") or github_user.get("login") or "GitHub 用户"
        avatar = github_user.get("avatar_url", "images/pattern-5.jpg")

        # 3. 获取主邮箱
        emails_resp = httpx.get("https://api.github.com/user/emails", headers=headers, timeout=20)
        emails_resp.raise_for_status()
        emails = emails_resp.json()
        primary_email = next(
            (e["email"] for e in emails if e.get("primary") and e.get("verified")),
            None,
        )
        if not primary_email:
            primary_email = next(
                (e["email"] for e in emails if e.get("verified")),
                None,
            )
        if not primary_email:
            raise HTTPException(status_code=400, detail="GitHub 账号未提供可用的验证邮箱")

        # 4. 查找或创建用户
        user = (
            db.query(models.User)
            .filter(models.User.oauth_provider == "github", models.User.oauth_id == github_id)
            .first()
        )
        if not user:
            existing_email = db.query(models.User).filter(models.User.email == primary_email).first()
            if existing_email:
                existing_email.oauth_provider = "github"
                existing_email.oauth_id = github_id
                if avatar and existing_email.avatar == "images/pattern-5.jpg":
                    existing_email.avatar = avatar
                db.commit()
                db.refresh(existing_email)
                user = existing_email
            else:
                user = models.User(
                    email=primary_email,
                    name=name,
                    avatar=avatar,
                    oauth_provider="github",
                    oauth_id=github_id,
                    role=models.UserRole.user,
                    hashed_password=None,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

        access_token_jwt = create_access_token(data={"sub": str(user.id)})
        redirect_url = f"{settings.FRONTEND_URL}/#/oauth/callback?token={access_token_jwt}"
        return RedirectResponse(redirect_url)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub 登录处理失败: {e}") from e




def _oauth_redirect_url(settings, provider: str) -> str:
    """统一跳回前端的 URL"""
    return f"{settings.FRONTEND_URL}/#/oauth/callback?token={provider}"


def _find_or_create_oauth_user(
    db: Session,
    provider: str,
    oauth_id: str,
    email: str,
    name: str,
    avatar: str,
):
    """根据 provider+oauth_id 查找或创建用户"""
    user = (
        db.query(models.User)
        .filter(models.User.oauth_provider == provider, models.User.oauth_id == oauth_id)
        .first()
    )
    if user:
        return user

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        existing.oauth_provider = provider
        existing.oauth_id = oauth_id
        if avatar and existing.avatar == "images/pattern-5.jpg":
            existing.avatar = avatar
        db.commit()
        db.refresh(existing)
        return existing

    user = models.User(
        email=email,
        name=name,
        avatar=avatar,
        oauth_provider=provider,
        oauth_id=oauth_id,
        role=models.UserRole.user,
        hashed_password=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/oauth/wechat/authorize")
def wechat_authorize():
    """返回微信开放平台网站应用授权 URL（扫码登录）"""
    settings = get_settings()
    if not settings.WECHAT_APP_ID:
        raise HTTPException(status_code=503, detail="微信登录未配置")
    url = (
        f"https://open.weixin.qq.com/connect/qrconnect"
        f"?appid={settings.WECHAT_APP_ID}"
        f"&redirect_uri={urllib.parse.quote(settings.WECHAT_REDIRECT_URI, safe='')}"
        f"&response_type=code"
        f"&scope=snsapi_login"
        f"&state=wechat"
        f"#wechat_redirect"
    )
    return {"url": url}


@router.get("/oauth/wechat/callback")
def wechat_callback(code: str, db: Session = Depends(get_db)):
    """微信 OAuth 回调"""
    settings = get_settings()
    if not settings.WECHAT_APP_ID or not settings.WECHAT_APP_SECRET:
        raise HTTPException(status_code=503, detail="微信登录未配置")

    try:
        token_url = (
            f"https://api.weixin.qq.com/sns/oauth2/access_token"
            f"?appid={settings.WECHAT_APP_ID}"
            f"&secret={settings.WECHAT_APP_SECRET}"
            f"&code={code}"
            f"&grant_type=authorization_code"
        )
        token_resp = httpx.get(token_url, timeout=20)
        token_resp.raise_for_status()
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        openid = token_data.get("openid")
        if not access_token or not openid:
            raise HTTPException(status_code=400, detail="微信授权失败")

        user_url = (
            f"https://api.weixin.qq.com/sns/userinfo"
            f"?access_token={access_token}"
            f"&openid={openid}"
            f"&lang=zh_CN"
        )
        user_resp = httpx.get(user_url, timeout=20)
        user_resp.raise_for_status()
        wx_user = user_resp.json()
        if wx_user.get("errcode"):
            raise HTTPException(status_code=400, detail=f"微信用户信息获取失败: {wx_user.get('errmsg')}")

        oauth_id = str(wx_user.get("unionid") or openid)
        name = wx_user.get("nickname") or "微信用户"
        avatar = wx_user.get("headimgurl") or "images/pattern-5.jpg"
        email = f"wx_{openid}@wechat.miaoxiu.cn"

        user = _find_or_create_oauth_user(db, "wechat", oauth_id, email, name, avatar)
        access_token_jwt = create_access_token(data={"sub": str(user.id)})
        redirect_url = f"{settings.FRONTEND_URL}/#/oauth/callback?token={access_token_jwt}"
        return RedirectResponse(redirect_url)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"微信登录处理失败: {e}") from e


@router.get("/oauth/qq/authorize")
def qq_authorize():
    """返回 QQ 互联授权 URL"""
    settings = get_settings()
    if not settings.QQ_APP_ID:
        raise HTTPException(status_code=503, detail="QQ 登录未配置")
    url = (
        f"https://graph.qq.com/oauth2.0/authorize"
        f"?response_type=code"
        f"&client_id={settings.QQ_APP_ID}"
        f"&redirect_uri={urllib.parse.quote(settings.QQ_REDIRECT_URI, safe='')}"
        f"&state=qq"
        f"&scope=get_user_info"
    )
    return {"url": url}


@router.get("/oauth/qq/callback")
def qq_callback(code: str, db: Session = Depends(get_db)):
    """QQ 互联 OAuth 回调"""
    settings = get_settings()
    if not settings.QQ_APP_ID or not settings.QQ_APP_KEY:
        raise HTTPException(status_code=503, detail="QQ 登录未配置")

    try:
        token_url = (
            f"https://graph.qq.com/oauth2.0/token"
            f"?grant_type=authorization_code"
            f"&client_id={settings.QQ_APP_ID}"
            f"&client_secret={settings.QQ_APP_KEY}"
            f"&code={code}"
            f"&redirect_uri={urllib.parse.quote(settings.QQ_REDIRECT_URI, safe='')}"
        )
        token_resp = httpx.get(token_url, timeout=20)
        token_resp.raise_for_status()
        token_text = token_resp.text
        parsed = urllib.parse.parse_qs(token_text)
        access_token = parsed.get("access_token", [None])[0]
        if not access_token:
            raise HTTPException(status_code=400, detail="QQ 授权失败")

        openid_resp = httpx.get(
            f"https://graph.qq.com/oauth2.0/me?access_token={access_token}",
            timeout=20,
        )
        openid_resp.raise_for_status()
        openid_text = openid_resp.text.strip()
        # callback( {"client_id":"...","openid":"..."} );
        if openid_text.startswith("callback(") and openid_text.endswith(");"):
            openid_text = openid_text[9:-2].strip()
        openid_data = json.loads(openid_text)
        openid = openid_data.get("openid")
        if not openid:
            raise HTTPException(status_code=400, detail="QQ openid 获取失败")

        info_url = (
            f"https://graph.qq.com/user/get_user_info"
            f"?access_token={access_token}"
            f"&oauth_consumer_key={settings.QQ_APP_ID}"
            f"&openid={openid}"
            f"&format=json"
        )
        info_resp = httpx.get(info_url, timeout=20)
        info_resp.raise_for_status()
        qq_user = info_resp.json()
        if qq_user.get("ret") != 0:
            raise HTTPException(status_code=400, detail=f"QQ 用户信息获取失败: {qq_user.get('msg')}")

        name = qq_user.get("nickname") or "QQ 用户"
        avatar = qq_user.get("figureurl_qq_2") or qq_user.get("figureurl_qq_1") or "images/pattern-5.jpg"
        email = f"qq_{openid}@qq.miaoxiu.cn"

        user = _find_or_create_oauth_user(db, "qq", openid, email, name, avatar)
        access_token_jwt = create_access_token(data={"sub": str(user.id)})
        redirect_url = f"{settings.FRONTEND_URL}/#/oauth/callback?token={access_token_jwt}"
        return RedirectResponse(redirect_url)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"QQ 登录处理失败: {e}") from e
