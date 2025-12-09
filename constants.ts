import { DebateStage } from './types';

export const DEBATE_FLOW: DebateStage[] = [
  { id: 'setup', label: '设置', time: 0, type: 'setup' },
  { id: 'intro', label: '展示', time: 0, type: 'intro' },
  { id: 'test', label: '声效测试', time: 0, type: 'sound_check' },
  
  // 1. 开篇立论，正方一辩发言 (3m30s)
  { id: 's1', label: '开篇立论\n正方一辩', affTitle: '正方一辩\n开篇立论', negTitle: '请聆听', time: 210, type: 'normal', activeSide: 'aff' },
  
  // 2. 反方一辩盘问正方一辩 (1m30s)
  { id: 's2', label: '盘问环节\n反方一辩', affTitle: '正方一辩\n被盘问', negTitle: '反方一辩\n盘问', time: 90, type: 'normal', activeSide: 'neg' },
  
  // 3. 开篇立论，反方一辩发言 (3m30s)
  { id: 's3', label: '开篇立论\n反方一辩', affTitle: '请聆听', negTitle: '反方一辩\n开篇立论', time: 210, type: 'normal', activeSide: 'neg' },
  
  // 4. 正方一辩盘问反方一辩 (1m30s)
  { id: 's4', label: '盘问环节\n正方一辩', affTitle: '正方一辩\n盘问', negTitle: '反方一辩\n被盘问', time: 90, type: 'normal', activeSide: 'aff' },
  
  // 5. 正方二辩驳论发言 (2m30s)
  { id: 's5', label: '驳论发言\n正方二辩', affTitle: '正方二辩\n驳论', negTitle: '请聆听', time: 150, type: 'normal', activeSide: 'aff' },
  
  // 6. 反方二辩驳论发言 (2m30s)
  { id: 's6', label: '驳论发言\n反方二辩', affTitle: '请聆听', negTitle: '反方二辩\n驳论', time: 150, type: 'normal', activeSide: 'neg' },
  
  // 7. 正反二辩对辩 (各2分钟, 共4分钟) -> Dual Debate Mode
  { id: 's7', label: '对辩环节\n正反二辩', affTitle: '正方二辩\n对辩', negTitle: '反方二辩\n对辩', time: 120, type: 'dual_debate', activeSide: 'both' },
  
  // 8. 正方三辩盘问反方三、四辩 (2m30s)
  { id: 's8', label: '盘问环节\n正方三辩', affTitle: '正方三辩\n盘问', negTitle: '反方三四辩\n被盘问', time: 150, type: 'normal', activeSide: 'aff' },
  
  // 9. 反方三辩盘问正方三、四辩 (2m30s)
  { id: 's9', label: '盘问环节\n反方三辩', affTitle: '正方三四辩\n被盘问', negTitle: '反方三辩\n盘问', time: 150, type: 'normal', activeSide: 'neg' },
  
  // 10. 正方三辩小结陈词 (2m)
  { id: 's10', label: '小结陈词\n正方三辩', affTitle: '正方三辩\n小结', negTitle: '请聆听', time: 120, type: 'normal', activeSide: 'aff' },
  
  // 11. 反方三辩小结陈词 (2m)
  { id: 's11', label: '小结陈词\n反方三辩', affTitle: '请聆听', negTitle: '反方三辩\n小结', time: 120, type: 'normal', activeSide: 'neg' },
  
  // 12. 自由辩论 (各4分钟)
  { id: 's12', label: '自由辩论', affTitle: '自由辩论', negTitle: '自由辩论', time: 240, type: 'free_debate', activeSide: 'both' },
  
  // 13. 反方四辩总结陈词 (4m)
  { id: 's13', label: '总结陈词\n反方四辩', affTitle: '请聆听', negTitle: '反方四辩\n总结', time: 240, type: 'normal', activeSide: 'neg' },
  
  // 14. 正方四辩总结陈词 (4m)
  { id: 's14', label: '总结陈词\n正方四辩', affTitle: '正方四辩\n总结', negTitle: '请聆听', time: 240, type: 'normal', activeSide: 'aff' },
];

export const DEFAULT_LOGO = "https://upload.wikimedia.org/wikipedia/zh/thumb/1/18/Zhengzhou_University_logo.svg/1200px-Zhengzhou_University_logo.svg.png";