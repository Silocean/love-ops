import { useState, useEffect, useRef } from 'react'
import type { PersonInfo, MeetChannel } from '../types'
import { id, now } from '../utils'
import { getAgeFromBirthDate } from '../utils-date'
import { db } from '../storage'
import { MEET_CHANNEL_LABELS, STAGE_LABELS } from '../constants'
import type { RelationshipStage } from '../types'

interface Props {
  person: PersonInfo | null
  onSave: () => void
  onCancel: () => void
}

export default function PersonForm({ person, onSave, onCancel }: Props) {
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [job, setJob] = useState('')
  const [education, setEducation] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [hobbies, setHobbies] = useState('')
  const [familyBg, setFamilyBg] = useState('')
  const [contact, setContact] = useState('')
  const [matchmaker, setMatchmaker] = useState('')
  const [matchmakerContact, setMatchmakerContact] = useState('')
  const [meetChannel, setMeetChannel] = useState<MeetChannel>('friend')
  const [meetChannelNote, setMeetChannelNote] = useState('')
  const [stage, setStage] = useState<RelationshipStage>('initial')
  const fileRef = useRef<HTMLInputElement>(null)

  const estimatedBirthDateFromAge = (age: number): string => {
    const y = new Date().getFullYear() - age
    return `${y}-01-01`
  }

  useEffect(() => {
    if (person) {
      setName(person.name)
      setBirthDate(person.birthDate ?? (person.age ? estimatedBirthDateFromAge(person.age) : ''))
      setJob(person.job ?? '')
      setEducation(person.education ?? '')
      setPhotos(person.photos ?? [])
      setHobbies(person.hobbies ?? '')
      setFamilyBg(person.familyBg ?? '')
      setContact(person.contact ?? '')
      setMatchmaker(person.matchmaker ?? '')
      setMatchmakerContact(person.matchmakerContact ?? '')
      setMeetChannel(person.meetChannel ?? 'friend')
      setMeetChannelNote(person.meetChannelNote ?? '')
      setStage(person.stage ?? 'initial')
    }
  }, [person])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      setPhotos((prev) => [...prev, data])
    }
    reader.readAsDataURL(files[0])
  }

  const removePhoto = (i: number) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const ts = now()
    const computedAge = birthDate ? getAgeFromBirthDate(birthDate) : undefined
    if (person) {
      db.persons.update(person.id, (p) => ({
        ...p,
        name,
        birthDate: birthDate || undefined,
        age: computedAge,
        job: job || undefined,
        education: education || undefined,
        photos,
        hobbies: hobbies || undefined,
        familyBg: familyBg || undefined,
        contact: contact || undefined,
        matchmaker: matchmaker || undefined,
        matchmakerContact: matchmakerContact || undefined,
        meetChannel,
        meetChannelNote: meetChannelNote || undefined,
        stage,
        updatedAt: ts,
      }))
    } else {
      db.persons.add({
        id: id(),
        name,
        birthDate: birthDate || undefined,
        age: computedAge,
        job: job || undefined,
        education: education || undefined,
        photos,
        hobbies: hobbies || undefined,
        familyBg: familyBg || undefined,
        contact: contact || undefined,
        matchmaker: matchmaker || undefined,
        matchmakerContact: matchmakerContact || undefined,
        meetChannel,
        meetChannelNote: meetChannelNote || undefined,
        stage,
        createdAt: ts,
        updatedAt: ts,
      })
    }
    onSave()
  }

  return (
    <div className="page form-page">
      <div className="page-header">
        <h2>{person ? '编辑人选' : '添加人选'}</h2>
        <div className="header-actions">
          <button className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button className="btn btn-primary" onClick={handleSubmit}>保存</button>
        </div>
      </div>
      <form className="person-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h3>基本信息</h3>
          <div className="form-row">
            <label>姓名 *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="对方姓名" />
          </div>
          <div className="form-row two-cols">
            <div>
              <label>出生日期</label>
              <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              {birthDate && (
                <span className="form-hint-inline">
                  {getAgeFromBirthDate(birthDate) ?? '-'} 岁
                </span>
              )}
            </div>
            <div>
              <label>职业</label>
              <input value={job} onChange={(e) => setJob(e.target.value)} placeholder="职业" />
            </div>
          </div>
          <div className="form-row">
            <label>学历</label>
            <input value={education} onChange={(e) => setEducation(e.target.value)} placeholder="学历" />
          </div>
          <div className="form-row">
            <label>关系阶段</label>
            <select value={stage} onChange={(e) => setStage(e.target.value as RelationshipStage)}>
              {Object.entries(STAGE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>照片</label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handlePhoto}
              style={{ display: 'none' }}
            />
            <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              添加照片
            </button>
            <div className="photo-grid">
              {photos.map((src, i) => (
                <div key={i} className="photo-preview">
                  <img src={src} alt="" />
                  <button type="button" className="remove-photo" onClick={() => removePhoto(i)}>×</button>
                </div>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label>兴趣爱好</label>
            <textarea value={hobbies} onChange={(e) => setHobbies(e.target.value)} placeholder="兴趣爱好" rows={2} />
          </div>
          <div className="form-row">
            <label>家庭背景</label>
            <textarea value={familyBg} onChange={(e) => setFamilyBg(e.target.value)} placeholder="家庭背景" rows={2} />
          </div>
          <div className="form-row">
            <label>联系方式</label>
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="微信/电话" />
          </div>
        </section>

        <section className="form-section">
          <h3>认识渠道</h3>
          <div className="form-row">
            <label>介绍人</label>
            <input value={matchmaker} onChange={(e) => setMatchmaker(e.target.value)} placeholder="谁介绍的" />
          </div>
          <div className="form-row">
            <label>介绍人联系方式</label>
            <input value={matchmakerContact} onChange={(e) => setMatchmakerContact(e.target.value)} placeholder="联系方式" />
          </div>
          <div className="form-row">
            <label>认识渠道</label>
            <select value={meetChannel} onChange={(e) => setMeetChannel(e.target.value as MeetChannel)}>
              {Object.entries(MEET_CHANNEL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>渠道备注</label>
            <input value={meetChannelNote} onChange={(e) => setMeetChannelNote(e.target.value)} placeholder="补充说明" />
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>取消</button>
          <button type="submit" className="btn btn-primary">保存</button>
        </div>
      </form>
    </div>
  )
}
