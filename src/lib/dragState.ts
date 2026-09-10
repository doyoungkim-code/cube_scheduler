/**
 * HTML5 드래그 중 공유되는 상태.
 *
 * dragover 이벤트에서는 dataTransfer.getData() 가 스펙상 빈 문자열이라
 * "지금 끌고 있는 티켓이 어떤 활동인지"를 알 수 없다. 드래그 시작 시 여기에 적어 두고
 * 드롭 대상(타임테이블)이 읽는다. 드래그가 끝나면 비운다.
 */
export interface TicketDrag {
  ticketId: string
  activityName: string
}

let current: TicketDrag | null = null

export function beginTicketDrag(d: TicketDrag): void { current = d }
export function endTicketDrag(): void { current = null }
export function getTicketDrag(): TicketDrag | null { return current }
