import React, { createContext, useContext, useState, useCallback } from 'react';

type Lang = 'zh' | 'en';

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const translations: Record<Lang, Record<string, string>> = {
  zh: {
    // Navbar
    'nav.home': '首页',
    'nav.ai': 'AI纹样生成器',
    'nav.ar_showcase': 'AI×AR融合',
    'nav.ar': 'AR体验',
    'nav.kg': '纹样基因库',
    'nav.study': '研学课程',
    'nav.forum': '社区论坛',
    'nav.shop': '文创商城',
    'nav.profile': '个人空间',
    'nav.admin': '后台管理',
    'nav.login': '登录 / 注册',
    'nav.logout': '退出登录',

    // Hero
    'hero.title1': '算法重构经纬',
    'hero.title2': '智能延续纹样',
    'hero.desc': '基于生成式 AI 与 AR 技术的铜仁苗绣蜡染活态传承与文创智能设计研究平台，以算法守护非遗，以科技赋能乡村振兴',
    'hero.cta': '探索数字造物引擎',

    // Quick entries
    'qe.ai.title': 'AI纹样生成器',
    'qe.ai.desc': '输入文字，AI即刻生成苗族风格原创纹样',
    'qe.ar.title': 'AR虚拟展厅',
    'qe.ar.desc': '身临其境体验蜡染工坊，虚拟试穿文创服饰',
    'qe.study.title': '研学课程报名',
    'qe.study.desc': '线上+线下非遗研学，获取电子研学证书',
    'qe.shop.title': '文创商城',
    'qe.shop.desc': 'AI辅助设计文创产品，支持绣娘手作',

    // Culture stories
    'cs.label': 'CULTURAL HERITAGE',
    'cs.title': '文化故事',
    'cs.story1.title': '松桃苗绣 · 指尖上的史诗',
    'cs.story1.desc': '松桃苗绣是苗族刺绣的重要流派，以精细的平绣、辫绣、打籽绣闻名。每一针一线都承载着苗族先民对自然、祖先和生命的敬畏与热爱。',
    'cs.story1.tag': '非遗实拍',
    'cs.story2.title': '蝴蝶妈妈 · 创世神话',
    'cs.story2.desc': '在苗族古歌中，蝴蝶妈妈"妹榜妹略"从枫树心中诞生，生下十二个蛋，孵出人类万物。蝴蝶纹是苗族服饰中最神圣的纹样，象征生命起源。',
    'cs.story2.tag': '神话传说',
    'cs.story3.title': '蜡染工艺 · 冰纹之美',
    'cs.story3.desc': '蜡染是苗族古老的防染技艺。蜡刀蘸蜂蜡在布上绘制图案，浸入靛蓝染缸后产生独特的"冰裂纹"，每一件作品都是不可复制的艺术孤品。',
    'cs.story3.tag': '传统工艺',
    'cs.story4.title': '龙纹图腾 · 水牛与鱼的化身',
    'cs.story4.desc': '苗族龙纹不同于汉族的龙，它是水牛、鱼、蛇的复合体，代表着丰收与力量。在苗族织锦中，龙纹常与鱼纹、鸟纹交织，形成独特的图腾语言。',
    'cs.story4.tag': '图腾寓意',
    'cs.story5.title': '铜鼓纹 · 权力与祭祀',
    'cs.story5.desc': '铜鼓是苗族最重要的礼器和乐器，铜鼓纹象征权力、财富和祭祀。铜鼓纹以同心圆结构为中心，向外辐射太阳芒、青蛙等图案。',
    'cs.story5.tag': '文化符号',

    // Dashboard
    'db.label': 'LIVING HERITAGE',
    'db.title': '活态传承数据看板',
    'db.patterns': '采集纹样',
    'db.model': 'AI模型版本',
    'db.ar': 'AR体验次数',
    'db.artisans': '帮扶绣娘',
    'db.courses': '研学课程',
    'db.products': '文创产品',

    // Pattern Grid
    'pg.title': '无尽纹样',
    'pg.desc': 'AI 生成的海量苗族蜡染图案，每一帧都是算法与传统工艺的深度对话',

    // AR Lab
    'arl.label': 'INNOVATION LAB',
    'arl.title': 'AR 创新实验室',
    'arl.desc': '通过增强现实技术，将数字纹样无缝叠加于物理世界。用户可以在手机屏幕上预览蜡染图案在服饰、家居用品上的实际效果，实现"所见即所得"的文创消费体验。我们相信，AR 不仅是展示工具，更是连接数字创造与实体经济的桥梁。',
    'arl.latency': 'AR 渲染延迟',
    'arl.accuracy': '跟踪精度',
    'arl.web': '零安装体验',

    // AR Makeup
    'arm.label': 'AR MAKEUP SIMULATION',
    'arm.title': '肌肤印记',
    'arm.desc': '苗族未来主义美妆模拟 · 滚动页面旋转预览',

    // Knowledge Graph
    'kg.label': 'KNOWLEDGE GRAPH & ARCHIVE',
    'kg.title': '纹样知识图谱与数字化档案库',
    'kg.desc': '结构化的苗绣蜡染纹样数据库，探索纹样背后的文化故事与AI生成参考',
    'kg.graph_toggle': '知识图谱可视化',
    'kg.search': '搜索纹样名称、寓意...',
    'kg.all': '全部',
    'kg.plant': '植物纹',
    'kg.animal': '动物纹',
    'kg.geometry': '几何纹',
    'kg.mythology': '神话人物纹',
    'kg.download_img': '下载原图',
    'kg.download_line': '下载线稿',
    'kg.culture': '文化解读',
    'kg.occasion': '使用场合',
    'kg.ai_prompt': 'AI 生成参考 Prompt',

    // AI Generator
    'aig.label': 'AI PATTERN GENERATOR',
    'aig.title': 'AI 苗绣蜡染纹样智能设计',
    'aig.desc': '基于 Stable Diffusion + LoRA 的铜仁苗绣专属模型，输入文字或上传参考图即可生成原创纹样',
    'aig.model': '模型',
    'aig.update': '最后更新',
    'aig.license': '非商业授权',
    'aig.mode_text': '文生图',
    'aig.mode_image': '图生图',
    'aig.prompt_label': '提示词',
    'aig.prompt_placeholder': '描述你想要的纹样，如：苗绣风格的蝴蝶妈妈，几何对称，红蓝配色',
    'aig.ref_label': '参考图',
    'aig.upload': '点击上传参考图',
    'aig.style_label': '风格选择',
    'aig.style_miaoxiu': '苗绣风格',
    'aig.style_laran': '蜡染风格',
    'aig.style_fusion': '融合风格',
    'aig.color_label': '传统配色',
    'aig.generate': '生成纹样',
    'aig.generating': '生成中...',
    'aig.empty': '输入提示词，点击生成按钮开始创作',
    'aig.wait': 'AI 正在创作您的专属纹样...',
    'aig.eta': '预计耗时 2-5 秒',
    'aig.culture': '文化解析',
    'aig.save': '保存到个人空间',
    'aig.cc': '生成内容采用 CC BY-NC 4.0 协议，鼓励非商业使用。商业合作请联系团队获取授权。',

    // AR Experience
    'are.label': 'AR IMMERSIVE EXPERIENCE',
    'are.title': 'AR 沉浸式体验',
    'are.desc': '通过增强现实与 Three.js 3D 渲染技术，让您身临其境体验蜡染绘制过程，或将传统纹样虚拟试穿到服饰与家居用品上',
    'are.wax': '虚拟蜡染工坊',
    'are.wax_desc': '模拟蜡刀绘制 · AI风格迁移',
    'are.tryon': 'AR虚拟试穿',
    'are.tryon_desc': '3D预览 · 实时叠加',
    'are.home': 'AR家居试用',
    'are.home_desc': '家居场景 · 沉浸体验',
    'are.photo': '虚拟合影',
    'are.photo_desc': '3D模特 · 纹样更换',
    'are.tool_brush': '蜡刀绘制',
    'are.tool_erase': '擦除修正',
    'are.brush_size': '笔触粗细',
    'are.migrate': 'AI 蜡染风格迁移',
    'are.migrated': '风格迁移已应用',
    'are.save': '保存作品',
    'are.clear': '清空画布',
    'are.guide_title': '蜡染工艺指引',
    'are.guide1': '用蜡刀蘸取蜂蜡在画布上绘制图案',
    'are.guide2': '绘制完成后点击下方"AI风格迁移"',
    'are.guide3': '系统将自动转换为蜡染风格效果',
    'are.guide4': '可保存或分享您的作品',
    'are.select_pattern': '选择传统纹样',
    'are.select_scene': 'AR 应用场景',
    'are.scene_clothing': '服饰试穿',
    'are.scene_clothing_desc': '将纹样以数码印花形式覆盖到T恤、围巾',
    'are.scene_home': '家居试用',
    'are.scene_home_desc': '实时投影到墙面、桌面、抱枕',
    'are.scene_model': '虚拟合影',
    'are.scene_model_desc': '与穿着苗绣的3D虚拟模特合影',
    'are.start': '启动 AR 体验',
    'are.privacy': '需要摄像头权限 · 数据仅在本地处理',
    'are.live': 'AR 实时预览中',
    'are.end': '结束体验',
    'are.capture': '截图',
    'are.share': '分享',

    // Study Tour
    'st.label': 'STUDY TOUR & RURAL REVITALIZATION',
    'st.title': '研学课程与乡村振兴',
    'st.desc': '线上+线下非遗研学课程，文创商城助力绣娘增收，青年红色筑梦之旅',
    'st.tab_courses': '线上课程',
    'st.tab_trips': '线下研学',
    'st.tab_shop': '文创商城',
    'st.tab_artisans': '绣娘故事',
    'st.cert': '查看我的研学证书',
    'st.free': '免费学习',
    'st.book': '立即预约',
    'st.cart': '加入购物车',
    'st.support': '支持绣娘',
    'st.custom': '定制需求',
    'st.handmade': '绣娘手作',
    'st.ai_design': 'AI设计',
    'st.ratio': '手作/AI比例',

    // Forum
    'forum.label': 'COMMUNITY',
    'forum.title': '社区论坛',
    'forum.desc': '分享创作、交流技艺、结识同好，共同守护非遗文化',
    'forum.new_post': '发布帖子',
    'forum.all': '全部',
    'forum.ai': 'AI生成',
    'forum.tradition': '传统技艺',
    'forum.ar_exp': 'AR体验',
    'forum.share': '创作分享',
    'forum.diary': '研学日记',
    'forum.qa': '求助问答',
    'forum.recruit': '活动招募',
    'forum.submit': '发布',
    'forum.title_placeholder': '标题',
    'forum.content_placeholder': '分享你的想法、作品或问题...',
    'forum.tags_placeholder': '标签，用逗号分隔',

    // Shop / Cart / Orders
    'shop.label': 'SHOP',
    'shop.title': '非遗文创',
    'cart.title': '购物车',
    'orders.title': '我的订单',

    // Profile
    'prof.works': '我的作品',
    'prof.saved': '收藏',
    'prof.posts': '帖子',
    'prof.settings': '设置',
    'prof.edit_name': '编辑',
    'prof.role_admin': '项目管理员',
    'prof.role_user': '创作者',
    'prof.perm_title': '权限范围',
    'prof.logout': '退出登录',
    'prof.empty_works': '还没有生成作品，去 AI 纹样生成器试试吧',
    'prof.empty_saved': '还没有收藏任何作品',
    'prof.empty_posts': '还没有发布帖子',
    'prof.go_create': '前往创作',
    'prof.privacy': '隐私设置',
    'prof.notif': '消息通知',
    'prof.data_export': '数据导出',

    // Admin
    'adm.label': 'ADMIN DASHBOARD',
    'adm.title': '后台管理中心',
    'adm.logout': '退出管理',
    'adm.tab_overview': '数据概览',
    'adm.tab_patterns': '纹样管理',
    'adm.tab_ai': 'AI模型',
    'adm.tab_users': '用户反馈',
    'adm.tab_shop': '商城管理',
    'adm.total_ai': 'AI生成总次数',
    'adm.total_ar': 'AR体验次数',
    'adm.active_users': '活跃用户',
    'adm.orders': '商城订单',
    'adm.trend': '近6个月功能使用趋势',
    'adm.top_prompts': '热门提示词 TOP 5',
    'adm.feedback': '最新用户反馈',
    'adm.export_csv': '导出数据 (CSV)',
    'adm.patterns_title': '纹样数据集管理',
    'adm.upload': '上传新纹样',
    'adm.ai_models': 'AI 模型版本管理',
    'adm.user_stats': '用户行为统计',
    'adm.export_user': '导出用户数据 (CSV)',
    'adm.shop_title': '商城数据看板',

    // AR Showcase
    'ars.fusion': 'AI × AR 融合体验',
    'ars.desc': '从文字描述到纹样生成，再到增强现实预览——我们打通了"AI创作→AR体验→实体定制"的完整链路。让非物质文化遗产通过前沿科技，焕发全新的生命力。',
    'ars.workflow': 'AI→AR 完整链路',
    'ars.step1_title': 'AI 纹样生成',
    'ars.step1_desc': '输入自然语言描述，Stable Diffusion + LoRA 模型 instantly 生成具有铜仁苗族风格的原创纹样',
    'ars.step2_title': '纹样智能优化',
    'ars.step2_desc': '基于用户反馈持续微调模型，使生成结果更贴合传统审美',
    'ars.step3_title': 'AR 实时预览',
    'ars.step3_desc': '通过 WebAR 技术，将 AI 生成的纹样实时叠加到服饰、家居、虚拟模特上',
    'ars.step4_title': '一键下单定制',
    'ars.step4_desc': '满意后可直接购买实体文创产品，或联系绣娘进行手工定制',
    'ars.tech': '核心技术特性',
    'ars.examples': 'AI+AR 示例作品',
    'ars.same': '生成同款',
    'ars.try': 'AR 试穿',
    'ars.cta_title': '体验 AI + AR 的无限可能',
    'ars.cta_desc': '从灵感文字到可穿戴纹样，只需几秒钟。让苗族千年的艺术智慧，在您的指尖重生。',
    'ars.create_now': '立即创作',
    'ars.ar_room': 'AR 试衣间',

    // Login
    'login.back': '返回首页',
    'login.brand': '纹智苗韵',
    'login.subtitle': 'Miao Pattern AI · Tongren · 非遗智能传承平台',
    'login.login_tab': '登录',
    'login.register_tab': '注册',
    'login.name': '昵称',
    'login.name_placeholder': '您的昵称',
    'login.email': '邮箱',
    'login.email_placeholder': 'your@email.com',
    'login.password': '密码',
    'login.password_placeholder': '您的密码',
    'login.role': '注册身份',
    'login.role_creator': '创作者',
    'login.role_admin': '管理员',
    'login.submit_login': '登录',
    'login.submit_register': '注册',
    'login.error_empty': '请填写邮箱和密码',
    'login.error_all': '请填写所有字段',
    'login.error_short': '密码至少6位',
    'login.error_wrong': '邮箱或密码错误',
    'login.error_exists': '该邮箱已被注册',
    'login.demo_title': '快速体验账号',
    'login.demo_admin': '管理员体验',
    'login.demo_user': '创作者体验',
    'login.guest': '游客无需登录即可浏览基础内容',
    'login.success': '预约成功！',

    // Footer
    'footer.desc': '基于"AI+非遗"赋能乡村振兴——基于生成式AI与AR技术的铜仁苗绣蜡染活态传承与文创智能设计研究',
    'footer.project': '大学生创新创业训练计划项目 · 青年红色筑梦之旅',
    'footer.contact': '联系我们',
    'footer.copyright': '版权所有',
  },
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.ai': 'AI Generator',
    'nav.ar_showcase': 'AI × AR Fusion',
    'nav.ar': 'AR Experience',
    'nav.kg': 'Pattern Archive',
    'nav.study': 'Study Tour',
    'nav.forum': 'Community',
    'nav.profile': 'Profile',
    'nav.admin': 'Admin',
    'nav.login': 'Login / Register',
    'nav.logout': 'Logout',

    // Hero
    'hero.title1': 'Algorithms Redefine',
    'hero.title2': 'Intelligence Continues',
    'hero.desc': 'A research platform for Tongren Miao embroidery & batik intangible cultural heritage, powered by Generative AI and AR technology, revitalizing tradition through algorithms and empowering rural revitalization.',
    'hero.cta': 'Explore Digital Creation',

    // Quick entries
    'qe.ai.title': 'AI Pattern Generator',
    'qe.ai.desc': 'Type text, AI generates original Miao-style patterns instantly',
    'qe.ar.title': 'AR Virtual Gallery',
    'qe.ar.desc': 'Immersive batik workshop, virtual try-on of cultural products',
    'qe.study.title': 'Study Courses',
    'qe.study.desc': 'Online + offline ICH courses with digital certificates',
    'qe.shop.title': 'Cultural Shop',
    'qe.shop.desc': 'AI-designed cultural products supporting local artisans',

    // Culture stories
    'cs.label': 'CULTURAL HERITAGE',
    'cs.title': 'Cultural Stories',
    'cs.story1.title': 'Songtao Miao Embroidery',
    'cs.story1.desc': 'Songtao Miao embroidery is a major style of Miao needlework, renowned for its exquisite flat stitch, braid stitch, and seed stitch. Every stitch carries the awe and love of Miao ancestors for nature, ancestors, and life.',
    'cs.story1.tag': 'Heritage Documentary',
    'cs.story2.title': 'Butterfly Mother · Creation Myth',
    'cs.story2.desc': 'In Miao ancient songs, Butterfly Mother "Meibang Meilue" was born from the heart of a maple tree, laid twelve eggs, and hatched all living beings. The butterfly pattern is the most sacred motif in Miao clothing, symbolizing the origin of life.',
    'cs.story2.tag': 'Mythology',
    'cs.story3.title': 'Batik · The Beauty of Ice Cracks',
    'cs.story3.desc': 'Batik is an ancient resist-dyeing technique of the Miao people. Wax is applied to cloth with a copper knife, then dipped into an indigo dye vat, producing unique "ice crack" patterns. Each piece is an irreplaceable work of art.',
    'cs.story3.tag': 'Traditional Craft',
    'cs.story4.title': 'Dragon Totem · Buffalo & Fish',
    'cs.story4.desc': 'The Miao dragon is different from the Han Chinese dragon — it is a composite of buffalo, fish, and snake, representing strength and harvest. In Miao brocade, dragon patterns intertwine with fish and bird motifs, forming a unique totem language.',
    'cs.story4.tag': 'Totem Symbolism',
    'cs.story5.title': 'Bronze Drum · Power & Ritual',
    'cs.story5.desc': 'The bronze drum is the most important ritual instrument of the Miao people. Bronze drum patterns symbolize power, wealth, and worship, with concentric circles radiating sun rays and frog motifs.',
    'cs.story5.tag': 'Cultural Symbol',

    // Dashboard
    'db.label': 'LIVING HERITAGE',
    'db.title': 'Living Heritage Dashboard',
    'db.patterns': 'Patterns Collected',
    'db.model': 'AI Model Version',
    'db.ar': 'AR Experiences',
    'db.artisans': 'Artisans Supported',
    'db.courses': 'Study Courses',
    'db.products': 'Cultural Products',

    // Pattern Grid
    'pg.title': 'Endless Patterns',
    'pg.desc': 'AI-generated Miao batik patterns, where algorithms and traditional craftsmanship engage in deep dialogue',

    // AR Lab
    'arl.label': 'INNOVATION LAB',
    'arl.title': 'AR Innovation Lab',
    'arl.desc': 'Through augmented reality technology, digital patterns are seamlessly overlaid onto the physical world. Users can preview batik designs on clothing and home furnishings, achieving a "what you see is what you get" cultural consumption experience. We believe AR is not just a display tool, but a bridge connecting digital creation with the real economy.',
    'arl.latency': 'AR Render Latency',
    'arl.accuracy': 'Tracking Accuracy',
    'arl.web': 'Zero Install',

    // AR Makeup
    'arm.label': 'AR MAKEUP SIMULATION',
    'arm.title': 'Skin Imprint',
    'arm.desc': 'Miao-Futurism makeup simulation · Scroll to rotate preview',

    // Knowledge Graph
    'kg.label': 'KNOWLEDGE GRAPH & ARCHIVE',
    'kg.title': 'Pattern Knowledge Graph & Digital Archive',
    'kg.desc': 'Structured Miao embroidery & batik pattern database, exploring cultural stories behind patterns and AI generation references',
    'kg.graph_toggle': 'Knowledge Graph Visualization',
    'kg.search': 'Search pattern names, meanings...',
    'kg.all': 'All',
    'kg.plant': 'Plant',
    'kg.animal': 'Animal',
    'kg.geometry': 'Geometric',
    'kg.mythology': 'Mythological',
    'kg.download_img': 'Download Original',
    'kg.download_line': 'Download Line Art',
    'kg.culture': 'Cultural Interpretation',
    'kg.occasion': 'Usage Occasions',
    'kg.ai_prompt': 'AI Generation Reference Prompt',

    // AI Generator
    'aig.label': 'AI PATTERN GENERATOR',
    'aig.title': 'AI Miao Embroidery & Batik Pattern Design',
    'aig.desc': 'Based on Stable Diffusion + LoRA model specialized for Tongren Miao embroidery. Enter text or upload reference images to generate original patterns.',
    'aig.model': 'Model',
    'aig.update': 'Last Updated',
    'aig.license': 'Non-Commercial License',
    'aig.mode_text': 'Text-to-Image',
    'aig.mode_image': 'Image-to-Image',
    'aig.prompt_label': 'Prompt',
    'aig.prompt_placeholder': 'Describe your pattern, e.g., Miao embroidery style butterfly mother, geometric symmetry, red-blue palette',
    'aig.ref_label': 'Reference Image',
    'aig.upload': 'Click to upload reference image',
    'aig.style_label': 'Style',
    'aig.style_miaoxiu': 'Miao Embroidery',
    'aig.style_laran': 'Batik Style',
    'aig.style_fusion': 'Fusion Style',
    'aig.color_label': 'Traditional Colors',
    'aig.generate': 'Generate Pattern',
    'aig.generating': 'Generating...',
    'aig.empty': 'Enter a prompt and click generate to start creating',
    'aig.wait': 'AI is creating your exclusive pattern...',
    'aig.eta': 'Estimated time: 2-5 seconds',
    'aig.culture': 'Cultural Analysis',
    'aig.save': 'Save to Profile',
    'aig.cc': 'Generated content uses CC BY-NC 4.0 license, encouraging non-commercial use. Contact us for commercial licensing.',

    // AR Experience
    'are.label': 'AR IMMERSIVE EXPERIENCE',
    'are.title': 'AR Immersive Experience',
    'are.desc': 'Through augmented reality and Three.js 3D rendering technology, immerse yourself in the batik drawing process, or virtually try on traditional patterns onto clothing and home furnishings.',
    'are.wax': 'Virtual Batik Workshop',
    'are.wax_desc': 'Simulate wax knife drawing · AI style transfer',
    'are.tryon': 'AR Virtual Try-on',
    'are.tryon_desc': '3D preview · Real-time overlay',
    'are.home': 'AR Home Decor',
    'are.home_desc': 'Home scene · Immersive experience',
    'are.photo': 'Virtual Photo',
    'are.photo_desc': '3D model · Pattern swap',
    'are.tool_brush': 'Wax Knife',
    'are.tool_erase': 'Eraser',
    'are.brush_size': 'Brush Size',
    'are.migrate': 'AI Batik Style Transfer',
    'are.migrated': 'Style transfer applied',
    'are.save': 'Save Work',
    'are.clear': 'Clear Canvas',
    'are.guide_title': 'Batik Process Guide',
    'are.guide1': 'Use the wax knife to draw patterns on the canvas',
    'are.guide2': 'After drawing, click "AI Style Transfer" below',
    'are.guide3': 'The system automatically converts to batik style',
    'are.guide4': 'Save or share your work',
    'are.select_pattern': 'Select Traditional Pattern',
    'are.select_scene': 'AR Application Scene',
    'are.scene_clothing': 'Clothing Try-on',
    'are.scene_clothing_desc': 'Overlay patterns digitally onto T-shirts, scarves',
    'are.scene_home': 'Home Decor',
    'are.scene_home_desc': 'Project onto walls, tables, pillows in real-time',
    'are.scene_model': 'Virtual Photo',
    'are.scene_model_desc': 'Pose with a 3D virtual model wearing Miao embroidery',
    'are.start': 'Start AR Experience',
    'are.privacy': 'Camera permission required · Data stays local',
    'are.live': 'AR Live Preview',
    'are.end': 'End Experience',
    'are.capture': 'Capture',
    'are.share': 'Share',

    // Study Tour
    'st.label': 'STUDY TOUR & RURAL REVITALIZATION',
    'st.title': 'Study Tour & Rural Revitalization',
    'st.desc': 'Online + offline intangible cultural heritage courses, cultural shop supporting local artisans, Youth Red Dream Journey',
    'st.tab_courses': 'Online Courses',
    'st.tab_trips': 'Study Trips',
    'st.tab_shop': 'Cultural Shop',
    'st.tab_artisans': 'Artisan Stories',
    'st.cert': 'View My Certificate',
    'st.free': 'Free Learning',
    'st.book': 'Book Now',
    'st.cart': 'Add to Cart',
    'st.support': 'Support Artisan',
    'st.custom': 'Custom Order',
    'st.handmade': 'Handmade',
    'st.ai_design': 'AI Design',
    'st.ratio': 'Handmade/AI Ratio',

    // Forum
    'forum.label': 'COMMUNITY',
    'forum.title': 'Community Forum',
    'forum.desc': 'Share creations, exchange techniques, connect with enthusiasts, jointly protect intangible cultural heritage',
    'forum.new_post': 'New Post',
    'forum.all': 'All',
    'forum.ai': 'AI Generated',
    'forum.tradition': 'Traditional Craft',
    'forum.ar_exp': 'AR Experience',
    'forum.share': 'Creative Share',
    'forum.diary': 'Study Diary',
    'forum.qa': 'Q&A',
    'forum.recruit': 'Events',
    'forum.submit': 'Post',
    'forum.title_placeholder': 'Title',
    'forum.content_placeholder': 'Share your thoughts, works, or questions...',
    'forum.tags_placeholder': 'Tags, separated by commas',

    // Shop / Cart / Orders
    'shop.label': 'SHOP',
    'shop.title': 'Heritage Shop',
    'cart.title': 'Shopping Cart',
    'orders.title': 'My Orders',

    // Profile
    'prof.works': 'My Works',
    'prof.saved': 'Saved',
    'prof.posts': 'Posts',
    'prof.settings': 'Settings',
    'prof.edit_name': 'Edit',
    'prof.role_admin': 'Administrator',
    'prof.role_user': 'Creator',
    'prof.perm_title': 'Permission Scope',
    'prof.logout': 'Logout',
    'prof.empty_works': 'No generated works yet, try the AI Pattern Generator',
    'prof.empty_saved': 'No saved works yet',
    'prof.empty_posts': 'No posts yet',
    'prof.go_create': 'Go Create',
    'prof.privacy': 'Privacy Settings',
    'prof.notif': 'Notifications',
    'prof.data_export': 'Export Data',

    // Admin
    'adm.label': 'ADMIN DASHBOARD',
    'adm.title': 'Admin Dashboard',
    'adm.logout': 'Exit Admin',
    'adm.tab_overview': 'Overview',
    'adm.tab_patterns': 'Patterns',
    'adm.tab_ai': 'AI Models',
    'adm.tab_users': 'User Feedback',
    'adm.tab_shop': 'Shop Management',
    'adm.total_ai': 'Total AI Generations',
    'adm.total_ar': 'Total AR Experiences',
    'adm.active_users': 'Active Users',
    'adm.orders': 'Shop Orders',
    'adm.trend': '6-Month Usage Trend',
    'adm.top_prompts': 'Top 5 Prompts',
    'adm.feedback': 'Recent User Feedback',
    'adm.export_csv': 'Export Data (CSV)',
    'adm.patterns_title': 'Pattern Dataset Management',
    'adm.upload': 'Upload New Pattern',
    'adm.ai_models': 'AI Model Version Management',
    'adm.user_stats': 'User Behavior Statistics',
    'adm.export_user': 'Export User Data (CSV)',
    'adm.shop_title': 'Shop Data Dashboard',

    // AR Showcase
    'ars.fusion': 'AI × AR Fusion Experience',
    'ars.desc': 'From text description to pattern generation, to augmented reality preview — we have created a complete pipeline of "AI Creation → AR Experience → Physical Customization". Let intangible cultural heritage come alive through cutting-edge technology.',
    'ars.workflow': 'AI→AR Complete Pipeline',
    'ars.step1_title': 'AI Pattern Generation',
    'ars.step1_desc': 'Enter natural language description, Stable Diffusion + LoRA model instantly generates original patterns with Tongren Miao style',
    'ars.step2_title': 'Pattern Optimization',
    'ars.step2_desc': 'Continuously fine-tune the model based on user feedback for results closer to traditional aesthetics',
    'ars.step3_title': 'AR Real-time Preview',
    'ars.step3_desc': 'Through WebAR technology, overlay AI-generated patterns onto clothing, home decor, and virtual models',
    'ars.step4_title': 'One-click Order',
    'ars.step4_desc': 'Purchase physical cultural products or contact artisans for handmade customization',
    'ars.tech': 'Core Technologies',
    'ars.examples': 'AI+AR Example Works',
    'ars.same': 'Generate Same Style',
    'ars.try': 'AR Try-on',
    'ars.cta_title': 'Experience the Infinite Possibilities of AI + AR',
    'ars.cta_desc': 'From inspirational text to wearable patterns, in just a few seconds. Let the thousand-year wisdom of Miao art be reborn at your fingertips.',
    'ars.create_now': 'Create Now',
    'ars.ar_room': 'AR Fitting Room',

    // Login
    'login.back': 'Back to Home',
    'login.brand': 'Miao Pattern AI',
    'login.subtitle': 'Miao Pattern AI · Tongren · ICH Smart Heritage Platform',
    'login.login_tab': 'Login',
    'login.register_tab': 'Register',
    'login.name': 'Name',
    'login.name_placeholder': 'Your name',
    'login.email': 'Email',
    'login.email_placeholder': 'your@email.com',
    'login.password': 'Password',
    'login.password_placeholder': 'Your password',
    'login.role': 'Register As',
    'login.role_creator': 'Creator',
    'login.role_admin': 'Admin',
    'login.submit_login': 'Login',
    'login.submit_register': 'Register',
    'login.error_empty': 'Please fill in email and password',
    'login.error_all': 'Please fill in all fields',
    'login.error_short': 'Password must be at least 6 characters',
    'login.error_wrong': 'Invalid email or password',
    'login.error_exists': 'This email is already registered',
    'login.demo_title': 'Quick Demo Accounts',
    'login.demo_admin': 'Admin Demo',
    'login.demo_user': 'Creator Demo',
    'login.guest': 'Guests can browse basic content without login',
    'login.success': 'Booking successful!',

    // Footer
    'footer.desc': 'AI+ICH Empowering Rural Revitalization — Research on Tongren Miao Embroidery & Batik Living Heritage and Cultural Creative Smart Design Based on Generative AI and AR Technology',
    'footer.project': 'University Student Innovation Training Program · Youth Red Dream Journey',
    'footer.contact': 'Contact Us',
    'footer.copyright': 'All Rights Reserved',
  },
};

const I18nContext = createContext<I18nState | null>(null);

const VALID_LANGS: Lang[] = ['zh', 'en'];

function isValidLang(value: string | null): value is Lang {
  return value !== null && VALID_LANGS.includes(value as Lang);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('gene-e-lang');
      if (isValidLang(saved)) return saved;
      return 'zh';
    } catch {
      return 'zh';
    }
  });

  const setLang = useCallback((l: Lang) => {
    if (isValidLang(l)) {
      setLangState(l);
      try {
        localStorage.setItem('gene-e-lang', l);
      } catch {
        // ignore
      }
    }
  }, []);

  const t = useCallback(
    (key: string) => {
      const dict = translations[lang];
      if (!dict) {
        console.warn(`[i18n] Invalid lang: ${lang}, falling back to key`);
        return key;
      }
      const value = dict[key];
      if (value === undefined) {
        console.warn(`[i18n] Missing key: ${key} for lang: ${lang}`);
        return key;
      }
      return value;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


