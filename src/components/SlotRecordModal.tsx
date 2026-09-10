import { useMemo } from 'react'
import type { Activity, SlotRecord } from '../types/schedule'
import type { Ticket } from '../types/kanban'
import { activityFieldsForName, emptyActivityFields } from '../types/kanban'
import type { TaskGroup } from '../lib/slots'
import TicketModal from './TicketModal'

interface Props {
  group: TaskGroup
  activities: Activity[]
  /** 구간 전체에 기록 적용 */
  onSave: (startMin: number, endMin: number, record: SlotRecord) => void
  /** 구간 삭제 */
  onDelete: (startMin: number, endMin: number) => void
  onClose: () => void
}

/**
 * 타임라인 구간의 기록(제목·설명·활동별 세부 항목)을 편집하는 모달.
 * TicketModal 을 재사용하되 칸반 티켓과는 저장이 완전히 별개다.
 * TimeTable(현재 시간대), HourDetail, TimelineVertical 이 함께 쓴다.
 */
export default function SlotRecordModal({ group, activities, onSave, onDelete, onClose }: Props) {
  const draft = useMemo<Ticket>(() => {
    const act = activities.find(a => a.name === group.label)
    const rec = group.record
    return {
      id: '',
      title: rec?.title ?? '',
      description: rec?.description ?? group.detail,
      why: '',
      activityId: act?.id ?? '',
      status: 'progress',
      activityFields: rec?.activityFields ?? (act ? activityFieldsForName(act.name) : emptyActivityFields()),
      order: 0,
      createdAt: '',
      updatedAt: '',
    }
  }, [group, activities])

  return (
    <TicketModal
      ticket={draft}
      defaultStatus="progress"
      activities={activities}
      hideStatus
      hideWhy
      mode="record"
      onSave={t => {
        onSave(group.startMin, group.endMin, {
          title: t.title,
          description: t.description,
          activityFields: t.activityFields,
        })
        onClose()
      }}
      onDelete={() => { onDelete(group.startMin, group.endMin); onClose() }}
      onClose={onClose}
    />
  )
}
