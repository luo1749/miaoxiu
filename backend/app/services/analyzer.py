import re
from typing import List

# 文化元素关键词映射
CULTURE_MAP = {
    "蝴蝶": {
        "elements": ["蝴蝶", "花卉", "几何对称"],
        "meaning": "蝴蝶妈妈是苗族创世神话中的始祖，象征生命起源与繁衍。此纹样以蝴蝶为核心，周围环绕花卉与几何图案，体现苗族对自然万物的崇拜。"
    },
    "龙": {
        "elements": ["龙纹", "水波纹", "云雷纹"],
        "meaning": "苗族龙纹是水牛、鱼、蛇的复合体，象征丰收与力量。与水波纹结合，寓意风调雨顺、五谷丰登。"
    },
    "铜鼓": {
        "elements": ["铜鼓", "太阳芒", "蛙纹"],
        "meaning": "铜鼓纹是苗族最重要的礼器纹样，同心圆结构象征宇宙秩序，太阳芒代表光明与温暖，蛙纹寓意繁衍生息。"
    },
    "鱼": {
        "elements": ["鱼纹", "水波纹", "莲花"],
        "meaning": "鱼纹寓意多子多福、生活富足，常与莲花组合表达连年有余的美好祝愿。"
    },
    "鸟": {
        "elements": ["鸟纹", "云纹", "树枝"],
        "meaning": "鸟纹是苗族祖先的灵魂使者，象征吉祥如意，沟通天地，常与云纹、树枝结合表达自由与生机。"
    },
    "花": {
        "elements": ["牡丹", "藤蔓", "鸟纹"],
        "meaning": "花卉刺绣中的牡丹象征富贵吉祥，藤蔓代表生命绵延，鸟纹则是苗族祖先的灵魂使者，三者结合寓意幸福美满。"
    },
}

DEFAULT_ANALYSIS = {
    "elements": ["几何花卉", "云雷纹", "抽象自然"],
    "meaning": "此纹样融合苗族传统几何花卉与云雷纹元素，体现苗族人民对自然万物的崇拜与对美好生活的向往。"
}


def analyze_prompt(prompt: str) -> dict:
    """基于提示词关键词匹配文化寓意（Kimi 不可用时作为降级方案）"""
    prompt = prompt.lower()
    for keyword, data in CULTURE_MAP.items():
        if re.search(keyword, prompt):
            return data
    return DEFAULT_ANALYSIS


def extract_keywords(prompt: str) -> List[str]:
    """提取提示词中的文化关键词"""
    keywords = []
    for keyword in CULTURE_MAP.keys():
        if re.search(keyword, prompt):
            keywords.append(keyword)
    return keywords

