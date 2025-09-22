import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, User, Briefcase, Building2, Mail, Phone, GraduationCap, MapPin, Star, ArrowLeft } from 'lucide-react'
import { search, studentSearch, type SearchResult, type SearchResponse } from '../global/api'
import { useAuth } from '../hooks/useAuth'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import Layout from '../components/layout/Layout'

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { userRole } = useAuth()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  
  // Request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  const searchTypes = userRole === 'student' 
    ? [
        { id: 'all', label: 'All', icon: Search },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'companies', label: 'Companies', icon: Building2 }
      ]
    : [
        { id: 'all', label: 'All', icon: Search },
        { id: 'students', label: 'Students', icon: User },
        { id: 'jobs', label: 'Jobs', icon: Briefcase },
        { id: 'companies', label: 'Companies', icon: Building2 }
      ]

  const performSearch = useCallback(async () => {
    // Cancel previous request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    setIsLoading(true)
    setError(null)
    
    try {
      let searchResults: SearchResponse
      
      if (userRole === 'student') {
        // Students can only search companies and jobs
        const studentResults = await studentSearch(query, selectedType === 'all' ? undefined : selectedType, 50)
        searchResults = {
          ...studentResults,
          students: [] // Ensure students array is empty for students
        }
      } else {
        // Placement officers and admins can search everything
        searchResults = await search(query, selectedType === 'all' ? undefined : selectedType, 50)
      }
      
      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return
      }
      
      setResults(searchResults)
    } catch (err) {
      // Don't show error if request was cancelled
      if (!abortController.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults(null)
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [query, selectedType, userRole])

  // Debounced search effect
  useEffect(() => {
    if (query && query.length >= 2) {
      const timeoutId = setTimeout(performSearch, 500) // 500ms debounce
      return () => clearTimeout(timeoutId)
    } else {
      setResults(null)
    }
  }, [query, performSearch])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.length >= 2) {
      setSearchParams({ q: query })
      performSearch()
    }
  }

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'student') {
      navigate(`/placement-officer/students?highlight=${result.id}`)
    } else if (result.type === 'job') {
      navigate(`/placement-officer/jobs?highlight=${result.id}`)
    } else if (result.type === 'company') {
      navigate(`/placement-officer/companies?highlight=${result.id}`)
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'student':
        return <User className="w-5 h-5 text-blue-500" />
      case 'job':
        return <Briefcase className="w-5 h-5 text-green-500" />
      case 'company':
        return <Building2 className="w-5 h-5 text-purple-500" />
      default:
        return <Search className="w-5 h-5 text-gray-500" />
    }
  }

  const getMatchFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      name: 'Name',
      email: 'Email',
      rollNumber: 'Roll Number',
      department: 'Department',
      course: 'Course',
      programType: 'Program Type',
      phone: 'Phone'
    }
    return labels[field] || field
  }

  const highlightMatch = (text: string, query: string) => {
    if (!text || !query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : part
    )
  }

  const renderStudentResult = (student: SearchResult) => (
    <motion.div
      key={student.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => handleResultClick(student)}
      className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
          {getResultIcon(student.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {highlightMatch(student.name, query)}
            </h3>
            {student.isPlaced && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Star className="w-3 h-3 mr-1" />
                Placed
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="truncate">{student.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              <span>{student.rollNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{student.department}</span>
            </div>
            {student.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{student.phone}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Course: {student.course}</span>
            <span>Program: {student.programType}</span>
            {student.cgpa && <span>CGPA: {student.cgpa}</span>}
            {student.attendance && <span>Attendance: {student.attendance}%</span>}
          </div>
          
          <div className="mt-2 text-xs text-blue-600">
            Matched in: {getMatchFieldLabel(student.matchField)}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderJobResult = (job: SearchResult) => (
    <motion.div
      key={job.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => handleResultClick(job)}
      className="p-6 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-lg cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
          {getResultIcon(job.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {highlightMatch(job.name, query)}
          </h3>
          <div className="text-sm text-gray-600 mb-2">
            Matched in: {getMatchFieldLabel(job.matchField)}
          </div>
        </div>
      </div>
    </motion.div>
  )

  const renderCompanyResult = (company: SearchResult) => (
    <motion.div
      key={company.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => handleResultClick(company)}
      className="p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
          {getResultIcon(company.type)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {highlightMatch(company.name, query)}
          </h3>
          <div className="text-sm text-gray-600 mb-2">
            Matched in: {getMatchFieldLabel(company.matchField)}
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">Search</h1>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search students, jobs, companies..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-12 h-12 text-lg"
                  />
                </div>
                <Button type="submit" disabled={query.length < 2} className="h-12 px-8">
                  Search
                </Button>
              </div>
            </form>

            {/* Search Type Filters */}
            <div className="flex gap-2 mb-6">
              {searchTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Results */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Searching...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-lg font-medium">Search Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {!isLoading && !error && results && results.total === 0 && query && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600">Try adjusting your search terms or filters</p>
            </div>
          )}

          {results && results.total > 0 && (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-sm text-gray-600">
                  Found <span className="font-semibold text-gray-900">{results.total}</span> result{results.total !== 1 ? 's' : ''} for "{query}"
                </p>
              </div>

              {/* Students */}
              {results.students.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Students ({results.students.length})
                  </h2>
                  <div className="grid gap-4">
                    {results.students.map(renderStudentResult)}
                  </div>
                </div>
              )}

              {/* Jobs */}
              {results.jobs.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-green-500" />
                    Jobs ({results.jobs.length})
                  </h2>
                  <div className="grid gap-4">
                    {results.jobs.map(renderJobResult)}
                  </div>
                </div>
              )}

              {/* Companies */}
              {results.companies.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    Companies ({results.companies.length})
                  </h2>
                  <div className="grid gap-4">
                    {results.companies.map(renderCompanyResult)}
                  </div>
                </div>
              )}
            </div>
          )}

          {!query && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
              <p className="text-gray-600">Enter a search term to find students, jobs, or companies</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SearchPage
