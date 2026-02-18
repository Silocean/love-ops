import type { MeetChannel, RelationshipStage, ContinueDecision, PaidBy, InitiatedBy } from './types'

export const PAID_BY_LABELS: Record<PaidBy, string> = {
  me: '我出钱',
  them: '对方出钱',
}

export const MEET_CHANNEL_LABELS: Record<MeetChannel, string> = {
  friend: '朋友介绍',
  blind_date: '相亲活动',
  dating_app: '婚恋网站/App',
  matchmaker: '媒人介绍',
  family: '亲人介绍',
  other: '其他',
}

export const STAGE_LABELS: Record<RelationshipStage, string> = {
  initial: '初识',
  getting_to_know: '了解中',
  dating: '交往中',
  considering: '考虑确定关系',
  ended: '已结束',
}

export const INITIATED_BY_LABELS: Record<InitiatedBy, string> = {
  me: '我主动',
  them: '对方主动',
}

export const DECISION_LABELS: Record<ContinueDecision, string> = {
  continue: '继续了解',
  pause: '暂缓',
  end: '不继续',
  undecided: '待定',
}
