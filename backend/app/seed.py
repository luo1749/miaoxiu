from sqlalchemy.orm import Session
from sqlalchemy import inspect
from app import models
from app.core.security import get_password_hash


def seed_data(engine):
    """初始化种子数据"""
    session = Session(bind=engine)
    try:
        # 仅在没有用户时初始化
        if session.query(models.User).first():
            return

        # 管理员账号
        admin = models.User(
            email="admin@miaoxiu.cn",
            name="项目管理员",
            hashed_password=get_password_hash("123456"),
            role=models.UserRole.admin,
            avatar="images/pattern-1.jpg",
            bio="平台管理员，负责运营与数据管理",
            ai_quota_daily=9999,
        )
        # 普通用户
        user = models.User(
            email="user@miaoxiu.cn",
            name="文创探索者",
            hashed_password=get_password_hash("123456"),
            role=models.UserRole.user,
            avatar="images/pattern-5.jpg",
            bio="热爱苗族文化，用 AI 探索传统纹样的无限可能",
        )
        session.add_all([admin, user])
        session.flush()

        # 传统纹样
        patterns = [
            models.Pattern(
                name="蝴蝶妈妈",
                category=models.PatternCategory.mythology,
                description="苗族创世神话中的始祖形象，从枫树心中诞生。",
                meaning="象征生命起源与繁衍，是苗族服饰中最神圣的纹样之一。",
                occasion="盛装、节日服饰、祭祀礼服",
                image_url="images/pattern-3.jpg",
                lineart_url="",
                ai_prompt="Miao mythology, butterfly mother, geometric symmetry, indigo and red",
                tags=["神话", "蝴蝶", "生命"],
                is_featured=True,
            ),
            models.Pattern(
                name="铜鼓纹",
                category=models.PatternCategory.geometry,
                description="以同心圆结构为中心，向外辐射太阳芒、青蛙等图案。",
                meaning="象征权力、财富和对太阳的崇拜，是重要的礼器纹样。",
                occasion="祭祀、重大节日、头帕与腰带",
                image_url="images/pattern-5.jpg",
                lineart_url="",
                ai_prompt="Miao bronze drum pattern, concentric circles, sun rays, frog motifs",
                tags=["铜鼓", "几何", "权力"],
                is_featured=True,
            ),
            models.Pattern(
                name="龙纹",
                category=models.PatternCategory.animal,
                description="苗族龙纹是水牛、鱼、蛇的复合体。",
                meaning="代表丰收与力量，寓意风调雨顺、五谷丰登。",
                occasion="男装、背扇、织锦",
                image_url="images/pattern-8.jpg",
                lineart_url="",
                ai_prompt="Miao dragon pattern, water buffalo, fish, snake, batik indigo",
                tags=["龙", "动物", "丰收"],
                is_featured=True,
            ),
            models.Pattern(
                name="鱼纹",
                category=models.PatternCategory.animal,
                description="鱼纹常与莲花、水波纹组合出现。",
                meaning="寓意多子多福、生活富足。",
                occasion="童装、肚兜、背扇",
                image_url="images/pattern-6.jpg",
                lineart_url="",
                ai_prompt="Miao fish pattern, lotus, water wave, batik style",
                tags=["鱼", "动物", "繁衍"],
            ),
            models.Pattern(
                name="牡丹花卉",
                category=models.PatternCategory.plant,
                description="花卉刺绣中的经典题材。",
                meaning="象征富贵吉祥、生命绵延。",
                occasion="女装、荷包、鞋垫",
                image_url="images/pattern-9.jpg",
                lineart_url="",
                ai_prompt="Miao embroidery peony flower, vine, bird, silk thread texture",
                tags=["花卉", "牡丹", "植物"],
            ),
        ]

        # 课程
        courses = [
            models.Course(
                title="苗绣纹样基础认知",
                subtitle="从零开始认识苗族刺绣纹样体系",
                description="本课程介绍苗绣的历史渊源、纹样分类、常用针法与色彩搭配。",
                cover_url="images/pattern-1.jpg",
                video_url="videos/time-fold.mp4",
                duration=45,
                difficulty="beginner",
                instructor="吴绣娘",
                is_featured=True,
            ),
            models.Course(
                title="蜡染工艺实操",
                subtitle="体验蜂蜡与靛蓝的传统对话",
                description="学习蜡染的防染原理、蜡刀使用、图案绘制与冰裂纹控制。",
                cover_url="images/pattern-6.jpg",
                video_url="videos/time-fold.mp4",
                duration=60,
                difficulty="intermediate",
                instructor="张蜡染传承人",
                is_featured=True,
            ),
            models.Course(
                title="AI 纹样生成实战",
                subtitle="用生成式 AI 创作原创苗族风格纹样",
                description="掌握提示词工程、风格控制、色彩预设与文化解析。",
                cover_url="images/pattern-3.jpg",
                video_url="videos/time-fold.mp4",
                duration=90,
                difficulty="advanced",
                instructor="AI 实验室",
                is_featured=True,
            ),
        ]

        # 商品
        products = [
            models.Product(
                name="苗绣蝴蝶妈妈丝巾",
                description="采用传统苗绣工艺，融合现代设计的高端丝巾。",
                price=298.0,
                original_price=398.0,
                image_url="images/pattern-3.jpg",
                category="服饰",
                stock=50,
                is_featured=True,
            ),
            models.Product(
                name="蜡染冰纹手提包",
                description="江口蜡染手工制作，每件冰纹独一无二。",
                price=468.0,
                original_price=568.0,
                image_url="images/pattern-6.jpg",
                category="箱包",
                stock=30,
                is_featured=True,
            ),
            models.Product(
                name="铜鼓纹银饰胸针",
                description="苗族银饰锻造技艺，铜鼓纹造型精致典雅。",
                price=168.0,
                image_url="images/pattern-5.jpg",
                category="饰品",
                stock=100,
            ),
            models.Product(
                name="AI 定制纹样 T 恤",
                description="上传你的 AI 生成纹样，定制专属文创 T 恤。",
                price=129.0,
                image_url="images/pattern-8.jpg",
                category="服饰",
                stock=200,
                is_featured=True,
            ),
        ]

        # 论坛帖子
        forum_posts = [
            models.ForumPost(
                user_id=admin.id,
                title="分享一组用AI生成的蝴蝶妈妈系列纹样",
                content="最近用平台AI生成器创作了一组以蝴蝶妈妈为主题的纹样，融合了传统几何对称与现代抽象风格，效果非常惊艳！",
                images=[],
                tags=["AI生成", "蝴蝶妈妈", "创作分享"],
                status="approved",
            ),
            models.ForumPost(
                user_id=admin.id,
                title="关于传统蜡染工艺的几点思考",
                content="作为从事蜡染工艺多年的手艺人，很高兴看到年轻人用新技术让传统纹样焕发新生。AI不是替代，而是让更多人认识我们的文化。",
                images=[],
                tags=["传统技艺", "蜡染", "传承"],
                status="approved",
            ),
            models.ForumPost(
                user_id=user.id,
                title="AR试穿功能体验分享",
                content="刚刚体验了AR虚拟试穿，把生成的铜鼓纹图案叠加在照片上，效果很真实。期待后续支持更多纹样和3D模特。",
                images=[],
                tags=["AR体验", "铜鼓纹", "虚拟试穿"],
                status="approved",
            ),
        ]

        session.add_all(patterns + courses + products + forum_posts)
        session.commit()
    finally:
        session.close()

