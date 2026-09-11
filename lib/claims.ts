import { atlas, type Topic, type TopicProject } from "./atlas";

/**
 * 「自述与实测」—— **开源项目说的，和用的人撞到的，对不对得上。**
 *
 * ## 为什么单独一页
 *
 * 这两天采集下来最有信息量的从来不是「有什么」，是**「什么是假的」**：
 * 星速全场最高的项目，它自己的 issue 区在追问「有人真做出来过吗」；
 * README 写着「支持被打断」，issue 里说「最快三秒，没法用」；
 * 四个项目挂着开源的名头，仓库里连许可证文件都没有。
 *
 * 这些结论**别处查不到** —— 要同时读完 README、文档、DeepWiki 和 issue 才拼得出来。
 * 但它们现在散在几十张卡片的「局限」里，**没有一个入口把它们收在一起**。
 * 一个人如果只想问「我该当心什么」，他得把两个专项一百多张卡翻一遍。
 *
 * ## 能算的绝不手写（沿用 caveats 那一页的规矩）
 *
 * 手写的清单必然过期：数据一改，清单还停在旧事实上。
 * 所以许可证那几类**全部现算** —— 哪天作者补了 LICENSE 文件，那一条自己就消失。
 *
 * **但「自述和实测打架」算不出来。** 它是两段文字的矛盾，
 * 得有人读过两边才判得了。这一类写在 `topic.conflicts` 里，
 * 每条必须带两侧出处 —— 少了出处它就退回成传闻，而传闻正是这一页要挡的东西。
 */
export type Claim = {
  kind: "no-license" | "license-limits" | "layered-license" | "label-wrong" | "famous-but-dead" | "said-vs-hit";
  /** 哪个项目、在哪个专项。 */
  topic: string;
  topicId: string;
  project: string;
  projectId: string;
  /** 一句话说清楚差在哪。 */
  what: string;
  /** 「说的」那一边（自述 / 标签 / 星数）。 */
  said?: string;
  /** 「撞到的」那一边（issue / 实际文件 / 停更）。 */
  hit?: string;
  /** 出处。手写那一类必填。 */
  src?: { title: string; url: string }[];
};

/**
 * 手写那一类的数据形状。**两侧都要有出处** ——
 * 只有一侧的「据说」不收，那和传闻没区别。
 */
export type Conflict = {
  project: string;
  what: string;
  said: string;
  hit: string;
  src: { title: string; url: string }[];
  verified_at: string;
};

const P = (t: Topic, p: TopicProject) => ({
  topic: t.zh, topicId: t.id, project: p.zh, projectId: p.id,
});

export function claims(): Claim[] {
  const out: Claim[] = [];

  for (const t of atlas.topics) {
    for (const p of t.projects ?? []) {
      /**
       * ① **挂着开源的名头，仓库里没有许可证文件。**
       * 没有明示授权即保留所有权利 —— 商用之前得找作者，这是硬成本。
       */
      if (/没有许可证文件/.test(p.license)) {
        out.push({
          kind: "no-license", ...P(t, p),
          what: "仓库里没有 LICENSE 文件 —— 没有明示授权即保留所有权利，商用前必须联系作者",
          said: p.license_note?.includes("徽章") ? "README 上挂着开源许可证徽章" : "以开源项目的形式发布",
          hit: "查目录确认没有许可证文件",
        });
      }
      /**
       * ② **许可证写着可商用，但把地区或规模写了进去。**
       * 「开源」这两个字最容易盖住这一层。
       */
      else if (p.license_class === "restricted" && /不含|排除|欧盟|月活|年营收|只授权|仅.*项目/.test(p.license_note ?? "")) {
        out.push({
          kind: "license-limits", ...P(t, p),
          what: p.license_note!.replace(/\*\*/g, "").slice(0, 160),
          said: `许可证名字是「${p.license}」`,
          hit: "条款里写着地区或规模门槛",
        });
      }
      /** ③ **封装层和上游不是同一个许可证** —— 两层要分开算。 */
      if (/上游/.test(p.license_note ?? "") && p.license_class === "copyleft") {
        out.push({
          kind: "layered-license", ...P(t, p),
          what: "封装层的许可证比上游严，两层要分开核",
          said: `上游是宽松许可`, hit: `这一层是 ${p.license}`,
        });
      }
      /** ④ **GitHub 的许可证标签认错了** —— 别信那个标签，看原文。 */
      if (/别信|识别|标成|标为/.test(p.license_note ?? "")) {
        out.push({
          kind: "label-wrong", ...P(t, p),
          what: p.license_note!.replace(/\*\*/g, "").slice(0, 150),
          said: "GitHub 页面上的许可证标签", hit: "许可证原文",
        });
      }
      /**
       * ⑤ **星数很高，但已经停更很久。**
       * 「有名」在这个领域是年龄的函数 —— 星数是存量，停更才是现状。
       */
      if ((p.stars ?? 0) >= 1000 && (p.stale_months ?? 0) >= 12) {
        out.push({
          kind: "famous-but-dead", ...P(t, p),
          what: `${p.stars} 星，但已经停更 ${p.stale_months} 个月`,
          said: `星数排在前列`, hit: `最后一次提交在 ${p.pushed_at}`,
        });
      }
    }

    /** ⑥ 自述与实测打架 —— **这一类算不出来，是人读出来的。** */
    for (const c of t.conflicts ?? []) {
      const p = (t.projects ?? []).find((x) => x.id === c.project);
      if (!p) continue;
      out.push({ kind: "said-vs-hit", ...P(t, p), what: c.what, said: c.said, hit: c.hit, src: c.src });
    }
  }

  /** 「自述与实测」排最前 —— 它是这一页的正题，其余是查得出来的硬事实。 */
  const order: Claim["kind"][] = ["said-vs-hit", "no-license", "license-limits", "layered-license", "label-wrong", "famous-but-dead"];
  return out.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}

export const CLAIM_ZH: Record<Claim["kind"], { zh: string; why: string }> = {
  "said-vs-hit": {
    zh: "自述说的，和用的人撞到的",
    why: "**这一类要读完 README 和 issue 两边才拼得出来**，算不出来，所以每条都带两侧出处。",
  },
  "no-license": {
    zh: "挂着开源的名头，没有许可证文件",
    why: "没有明示授权即保留所有权利。**徽章不是许可证** —— 有的仓库 README 上挂着 MIT 徽章，目录里却没有那个文件。",
  },
  "license-limits": {
    zh: "许可证把地区或规模写了进去",
    why: "「开源」这两个字最容易盖住这一层。出海产品、上了规模的团队，得先读条款再动手。",
  },
  "layered-license": {
    zh: "封装层和上游不是一个许可证",
    why: "上游宽松不等于你拿到的这一层宽松。**两层要分开核。**",
  },
  "label-wrong": {
    zh: "GitHub 的许可证标签认错了",
    why: "文件开头多一行版权声明，GitHub 就认不出来，标成「Other」。**别信标签，看原文。**",
  },
  "famous-but-dead": {
    zh: "星数很高，但已经停更很久",
    why: "在新领域里**星数是存量、停更才是现状**。一个三年前爆过的项目，今天未必还跟得上引擎版本。",
  },
};
