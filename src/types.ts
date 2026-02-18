// 认识渠道
export type MeetChannel = 'friend' | 'blind_date' | 'dating_app' | 'matchmaker' | 'family' | 'other'

// 关系阶段
export type RelationshipStage = 'initial' | 'getting_to_know' | 'dating' | 'considering' | 'ended'

// 是否继续
export type ContinueDecision = 'continue' | 'pause' | 'end' | 'undecided'

// 谁出钱
export type PaidBy = 'me' | 'them'

export interface PersonInfo {
  id: string
  name: string
  stage?: RelationshipStage
  age?: number
  job?: string
  education?: string
  photos: string[]  // base64
  hobbies?: string
  familyBg?: string
  contact?: string
  matchmaker?: string      // 介绍人
  matchmakerContact?: string
  meetChannel?: MeetChannel
  meetChannelNote?: string
  createdAt: string
  updatedAt: string
}

// 单条行程明细（一次约会内的一站）
export interface DateRecordItem {
  id: string
  time?: string      // HH:mm
  location?: string
  activity: string   // 如：午饭、打车、晚饭
  cost?: number
  paidBy?: PaidBy
}

// 零散消费（奶茶、零食等不便归属到行程的小额消费）
export interface DateMiscExpense {
  id: string
  activity: string   // 如：奶茶、零食
  cost: number
  paidBy: PaidBy
}

// 谁主动发起（约会）
export type InitiatedBy = 'me' | 'them'

// 一次约会 = 一天，可包含多条行程 + 零散消费
export interface DateRecord {
  id: string
  personId: string
  date: string           // YYYY-MM-DD
  items: DateRecordItem[]  // 行程明细
  miscExpenses: DateMiscExpense[]  // 零散消费
  notes: string
  photos: string[]
  tags?: string[]       // 约会标签，如：吃饭、看电影、旅行
  initiatedBy?: InitiatedBy  // 谁主动发起
  createdAt: string
  updatedAt: string
}

export interface Milestone {
  id: string
  personId: string
  title: string
  date: string
  notes?: string
  createdAt: string
}

export interface Impression {
  id: string
  personId: string
  pros: string[]
  cons: string[]
  toObserve: string[]
  tags: string[]
  personality?: string
  values?: string
  habits?: string
  updatedAt: string
}

export interface PendingQuestion {
  id: string
  personId: string
  question: string
  resolved: boolean
  resolvedNote?: string
  createdAt: string
  resolvedAt?: string
}

export interface NextPlan {
  id: string
  personId: string
  plannedDate?: string
  plannedLocation?: string
  plannedActivity?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Decision {
  id: string
  personId: string
  decision: ContinueDecision
  reason?: string
  decidedAt: string
}

export interface Reminder {
  id: string
  personId: string
  title: string
  date: string
  time?: string
  notes?: string
  triggered: boolean
  createdAt: string
}
