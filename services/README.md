# Services

此文件夹包含非 UI 的逻辑服务。

## 服务列表
- `audioService.ts`: 处理辩论赛中的提示音（30秒提醒、5秒提醒、结束提醒）。

## 修改建议
- 如果需要更换提示音音源，请修改 `audioService.ts` 中的 URL。
- 如果需要添加新的逻辑（如数据持久化），请在此处添加新的 service。
