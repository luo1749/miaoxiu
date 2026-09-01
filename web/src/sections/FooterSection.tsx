import { useI18n } from "../i18n";

export default function FooterSection() {
  const { t } = useI18n();
  return (
    <footer
      id="footer"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '60vh',
        backgroundColor: '#0B0E14',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '10vh 8vw',
        borderTop: '1px solid rgba(240, 237, 224, 0.05)',
      }}
    >
      <div className="max-w-7xl mx-auto w-full">
        {/* Giant text */}
        <h2
          className="font-bold text-[#F0EDE0]"
          style={{
            fontSize: 'clamp(3rem, 10vw, 10rem)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            opacity: 0.9,
          }}
        >
          纹智苗韵
          <span className="block text-[10px] font-normal opacity-40 mt-2 tracking-widest">MIAO PATTERN AI</span>
        </h2>

        <div className="mt-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <p className="serif-text text-[#F0EDE0] opacity-40 text-sm leading-relaxed max-w-md">
              基于"AI+非遗"赋能乡村振兴——基于生成式AI与AR技术的铜仁苗绣蜡染
              活态传承与文创智能设计研究
            </p>
            <p className="serif-text text-[#F0EDE0] opacity-30 text-xs mt-3">
              大学生创新创业训练计划项目 · 青年红色筑梦之旅
            </p>
          </div>

          <div className="text-right">
            <div className="flex flex-col gap-2 text-sm text-[#F0EDE0] opacity-40">
              <span>{t("footer.contact")}</span>
              <span className="serif-text opacity-60">gene-e@project.edu.cn</span>
              <span className="serif-text opacity-60">贵州省铜仁市</span>
            </div>
            <p className="text-xs text-[#F0EDE0] opacity-20 mt-6 serif-text">
              &copy; 2024 纹智苗韵 Miao Pattern AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
