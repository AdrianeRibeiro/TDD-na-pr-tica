import { set, reset } from 'mockdate'

class EventStatus { 
  status: 'active' | 'inReview' | 'done'

  constructor(event?: { endDate: Date, reviewDurationInHour: number }) {
    if(event === undefined) {
      this.status = 'done'
      return
    }

    const now = new Date()
    if(event.endDate >= now) {
      this.status = 'active'
      return
    }
    
    const reviewDurationInMs = event.reviewDurationInHour * 60 * 60 * 1000
    const reviewDate =  new Date(event.endDate.getTime() + reviewDurationInMs)
    this.status = reviewDate >= now ? 'inReview' : 'done'
  }
}

export class CheckLastEventStatus {
  constructor (private readonly loadLastEventRepository: LoadLastEventRepository) {}

  async perform({groupId}: {groupId: string}): Promise<EventStatus> {
    const event = await this.loadLastEventRepository.loadLastEvent({ groupId })
    return new EventStatus(event)
  }
}

export interface LoadLastEventRepository {
  loadLastEvent: (input: {groupId: string}) => Promise<{endDate: Date, reviewDurationInHour: number} | undefined>
}
