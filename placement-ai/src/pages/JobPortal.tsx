import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  MapPin, 
  Clock, 
  Building, 
  DollarSign,
  Briefcase,
  Star,
  Calendar,
  Users
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import { useToastNotifications } from '../components/ui/Toast'

interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  type: 'Full-time' | 'Part-time' | 'Internship' | 'Contract'
  experience: string
  deadline: string
  description: string
  requirements: string[]
  benefits: string[]
  skills: string[]
  postedDate: string
  applicants: number
  featured: boolean
}

const JobPortal = () => {
  const { success } = useToastNotifications()
  const [jobs, setJobs] = useState<Job[]>([])
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [filters, setFilters] = useState({
    type: 'all',
    location: 'all',
    experience: 'all'
  })

  // Mock job data
  useEffect(() => {
    const mockJobs: Job[] = [
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salary: '$120k - $180k',
        type: 'Full-time',
        experience: '5+ years',
        deadline: '2024-03-15',
        description: 'We are looking for a senior software engineer to join our team...',
        requirements: ['5+ years of experience', 'Proficiency in React, Node.js', 'Strong problem-solving skills'],
        benefits: ['Health insurance', '401k matching', 'Flexible work hours'],
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        postedDate: '2024-02-01',
        applicants: 45,
        featured: true
      },
      {
        id: '2',
        title: 'Frontend Developer Intern',
        company: 'StartupXYZ',
        location: 'Remote',
        salary: '$3k - $5k/month',
        type: 'Internship',
        experience: '0-2 years',
        deadline: '2024-03-01',
        description: 'Great opportunity for students to gain real-world experience...',
        requirements: ['Currently enrolled in CS program', 'Basic knowledge of HTML, CSS, JS'],
        benefits: ['Mentorship program', 'Certificate of completion'],
        skills: ['HTML', 'CSS', 'JavaScript', 'React'],
        postedDate: '2024-02-05',
        applicants: 23,
        featured: false
      },
      {
        id: '3',
        title: 'Data Scientist',
        company: 'DataCorp',
        location: 'New York, NY',
        salary: '$100k - $150k',
        type: 'Full-time',
        experience: '3+ years',
        deadline: '2024-03-20',
        description: 'Join our data science team to work on cutting-edge ML projects...',
        requirements: ['PhD in Data Science', 'Experience with Python, R', 'ML/AI expertise'],
        benefits: ['Competitive salary', 'Stock options', 'Learning budget'],
        skills: ['Python', 'R', 'Machine Learning', 'TensorFlow'],
        postedDate: '2024-02-03',
        applicants: 67,
        featured: true
      }
    ]

    setJobs(mockJobs)
    setFilteredJobs(mockJobs)
    setLoading(false)
  }, [])

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(job => job.type === filters.type)
    }

    // Location filter
    if (filters.location !== 'all') {
      filtered = filtered.filter(job => 
        job.location.toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    setFilteredJobs(filtered)
  }, [jobs, searchQuery, filters])

  const handleApply = (job: Job) => {
    setSelectedJob(job)
    setShowApplicationModal(true)
  }

  const handleApplicationSubmit = () => {
    success('Application submitted!', 'Your application has been sent successfully')
    setShowApplicationModal(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-green-100 text-green-800'
      case 'Part-time': return 'bg-blue-100 text-blue-800'
      case 'Internship': return 'bg-purple-100 text-purple-800'
      case 'Contract': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Layout title="Job Portal" hideNav>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Job Portal" subtitle="Find your dream job" hideNav>
      <div className="max-w-7xl mx-auto">
        {/* Search and Filters */}
        <Card className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search jobs, companies, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
              
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Locations</option>
                <option value="remote">Remote</option>
                <option value="san francisco">San Francisco</option>
                <option value="new york">New York</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Job Listings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Job Cards */}
          <div className="lg:col-span-2 space-y-4">
            {filteredJobs.length === 0 ? (
              <Card className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your search criteria</p>
              </Card>
            ) : (
              filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card hover className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          {job.featured && (
                            <Badge variant="warning" size="sm">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {job.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {job.salary}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                          <Badge className={getTypeColor(job.type)}>
                            {job.type}
                          </Badge>
                          <span>{job.experience}</span>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {job.applicants} applicants
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {job.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                          {job.skills.slice(0, 4).map((skill, skillIndex) => (
                            <Badge key={skillIndex} variant="outline" size="sm">
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 4 && (
                            <Badge variant="outline" size="sm">
                              +{job.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Posted {new Date(job.postedDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Deadline {new Date(job.deadline).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleApply(job)}
                        className="ml-4"
                      >
                        Apply Now
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Jobs</span>
                  <span className="font-semibold">{jobs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Featured Jobs</span>
                  <span className="font-semibold">{jobs.filter(j => j.featured).length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remote Jobs</span>
                  <span className="font-semibold">{jobs.filter(j => j.location.toLowerCase().includes('remote')).length}</span>
                </div>
              </div>
            </Card>

            {/* Job Types */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Types</h3>
              <div className="space-y-2">
                {['Full-time', 'Part-time', 'Internship', 'Contract'].map(type => (
                  <button
                    key={type}
                    onClick={() => setFilters(prev => ({ ...prev, type: type === 'All Types' ? 'all' : type }))}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      filters.type === type ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                    }`}
                  >
                    {type} ({jobs.filter(j => j.type === type).length})
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Application Modal */}
        <Modal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          title="Apply for Job"
          size="lg"
        >
          {selectedJob && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedJob.title}</h3>
                <p className="text-gray-600">{selectedJob.company} • {selectedJob.location}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="Tell us why you're interested in this position..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Briefcase className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Upload your resume or drag and drop</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Choose File
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowApplicationModal(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleApplicationSubmit}>
                  Submit Application
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  )
}

export default JobPortal
