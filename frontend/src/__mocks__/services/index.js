/**
 * Mock Services for Testing
 * Mock implementations of all API services
 */

// Mock data
const mockParticipant = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  roles: ['participant'],
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockTrack = {
  id: '123e4567-e89b-12d3-a456-426614174001',
  title: 'Test Track',
  description: 'A test track',
  category: 'outdoor',
  max_participants: 20,
  current_participants: 5,
  start_time: '2024-06-01T10:00:00Z',
  end_time: '2024-06-01T12:00:00Z',
  location: 'Test Location',
  labels: [],
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockActivity = {
  id: '123e4567-e89b-12d3-a456-426614174002',
  title: 'Test Activity',
  description: 'A test activity',
  type: 'workshop',
  start_time: '2024-06-01T14:00:00Z',
  end_time: '2024-06-01T16:00:00Z',
  location: 'Test Location',
  metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockSuggestions = {
  username: 'testuser',
  suggested_tracks: [mockTrack],
  suggested_activities: [mockActivity],
  metadata: {}
};

// Mock Participants Service
const mockParticipantsService = {
  getAll: vi.fn().mockResolvedValue({ data: [mockParticipant] }),
  getByUsername: vi.fn().mockResolvedValue({ data: mockParticipant }),
  create: vi.fn().mockResolvedValue({ data: mockParticipant }),
  updateByUsername: vi.fn().mockResolvedValue({ data: mockParticipant }),
  deleteByUsername: vi.fn().mockResolvedValue({ data: {} }),
  syncConnections: vi.fn().mockResolvedValue({ data: {} })
};

// Mock Tracks Service
const mockTracksService = {
  getAll: vi.fn().mockResolvedValue({ data: [mockTrack] }),
  getById: vi.fn().mockResolvedValue({ data: mockTrack }),
  create: vi.fn().mockResolvedValue({ data: mockTrack }),
  update: vi.fn().mockResolvedValue({ data: mockTrack }),
  delete: vi.fn().mockResolvedValue({ data: mockTrack }),
  subscribeScout: vi.fn().mockResolvedValue({ data: {} }),
  unsubscribeScout: vi.fn().mockResolvedValue({ data: {} }),
  addLabels: vi.fn().mockResolvedValue({ data: mockTrack }),
  removeLabels: vi.fn().mockResolvedValue({ data: mockTrack })
};

// Mock Activities Service
const mockActivitiesService = {
  getAll: vi.fn().mockResolvedValue({ data: [mockActivity] }),
  getById: vi.fn().mockResolvedValue({ data: mockActivity }),
  create: vi.fn().mockResolvedValue({ data: mockActivity }),
  update: vi.fn().mockResolvedValue({ data: mockActivity })
};

// Mock Suggestions Service
const mockSuggestionsService = {
  getSuggestions: vi.fn().mockResolvedValue({ data: mockSuggestions })
};

// Export individual services
export const participantsService = mockParticipantsService;
export const tracksService = mockTracksService;
export const activitiesService = mockActivitiesService;
export const suggestionsService = mockSuggestionsService;

// Default export with all services
export default {
  participants: mockParticipantsService,
  tracks: mockTracksService,
  activities: mockActivitiesService,
  suggestions: mockSuggestionsService
};
