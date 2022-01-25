import { set, reset } from 'mockdate'

type EventStatus = { status: string }

class CheckLastEventStatus {
  constructor (private readonly loadLastEventRepository: LoadLastEventRepository) {}

  async perform({groupId}: {groupId: string}): Promise<EventStatus> {
    const event = await this.loadLastEventRepository.loadLastEvent({ groupId })

    if(event === undefined) return { status: 'done' }

    const now = new Date()
    if(event.endDate >= now) return { status: 'active' } 
    
    const reviewDurationInMs = event.reviewDurationInHour * 60 * 60 * 1000
    const reviewDate =  new Date(event.endDate.getTime() + reviewDurationInMs)
    return reviewDate >= now ? { status: 'inReview' } : { status: 'done' }
  }
}

interface LoadLastEventRepository {
  loadLastEvent: (input: {groupId: string}) => Promise<{endDate: Date, reviewDurationInHour: number} | undefined>
}

class LoadLastEventRepositorySpy implements LoadLastEventRepository {
  groupId?: string
  callsCount = 0
  output?: {endDate: Date, reviewDurationInHour: number}

  async loadLastEvent({groupId}: {groupId: string}): Promise<{endDate: Date, reviewDurationInHour: number} | undefined> {
    this.groupId = groupId
    this.callsCount++
    return this.output
  }
}

type SutOutPut = { 
  sut: CheckLastEventStatus, 
  loadLastEventRepository: LoadLastEventRepositorySpy
}

const makeSut = ():  SutOutPut => {
  const loadLastEventRepository = new LoadLastEventRepositorySpy()

  //sut -> system under test, usado para saber quem eu estou testando
  const sut = new CheckLastEventStatus(loadLastEventRepository)
  
  return {
    sut,
    loadLastEventRepository
  }
}

describe('CheckLastEventStatus', () => {
  const groupId = 'any_group_id'

  beforeAll(() => {
    set(new Date())
  })

  afterAll(() => {
    reset()
  })

  it('should get last event data', async () => {
    const { sut, loadLastEventRepository } = makeSut()
  
    await sut.perform({ groupId })
  
    expect(loadLastEventRepository.groupId).toBe(groupId)
    expect(loadLastEventRepository.callsCount).toBe(1)
  })

  it('should return status done when there is no event', async () => {
    const { sut, loadLastEventRepository } = makeSut()

    const eventStatus = await sut.perform({ groupId })
  
    expect(eventStatus.status).toBe('done')
  })

  it('should return status active when now is before event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
  
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() + 1),
      reviewDurationInHour: 1
    }

    const eventStatus = await sut.perform({ groupId })
  
    expect(eventStatus.status).toBe('active')
  })

  it('should return status active when now is equal to event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
  
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime()),
      reviewDurationInHour: 1
    }

    const eventStatus = await sut.perform({ groupId })
  
    expect(eventStatus.status).toBe('active')
  })

  it('should return status inReview when now is after event end time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
  
    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - 1),
      reviewDurationInHour: 1
    }
  
    loadLastEventRepository.output = undefined
  
    const eventStatus = await sut.perform({ groupId })
  
    expect(eventStatus.status).toBe('inReview')
  })

  it('should return status inReview when now is before review time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    const reviewDurationInHour = 1
    const reviewDurationInMs = reviewDurationInHour * 60 * 60 * 1000

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs + 1),
      reviewDurationInHour
    }
  
    loadLastEventRepository.output = undefined
  
    const eventStatus = await sut.perform({ groupId })
  
    expect(eventStatus.status).toBe('inReview')
  })

  it('should return status inReview when now equal to review time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    const reviewDurationInHour = 1
    const reviewDurationInMs = reviewDurationInHour * 60 * 60 * 1000

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs),
      reviewDurationInHour
    }
  
    loadLastEventRepository.output = undefined
  
    const eventStatus = await sut.perform({ groupId })
  
    expect(eventStatus.status).toBe('inReview')
  })

  it('should return status done when now is after review time', async () => {
    const { sut, loadLastEventRepository } = makeSut()
    const reviewDurationInHour = 1
    const reviewDurationInMs = reviewDurationInHour * 60 * 60 * 1000

    loadLastEventRepository.output = {
      endDate: new Date(new Date().getTime() - reviewDurationInMs - 1),
      reviewDurationInHour
    }
  
    loadLastEventRepository.output = undefined
  
    const eventStatus = await sut.perform({ groupId })
  
    expect(eventStatus.status).toBe('done')
  })
})
