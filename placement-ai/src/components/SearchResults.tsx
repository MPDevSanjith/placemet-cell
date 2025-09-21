import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Search, User, Briefcase, Building2, GraduationCap, MapPin, Star } from 'lucide-react'
import { search, studentSearch, type SearchResult, type SearchResponse } from '../global/api'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface SearchResultsProps {
  query: string
  isOpen: boolean
  onClose: () => void
  position: { top: number; left: number; width: number }
}

const SearchResults = ({ query, isOpen, onClose, position }: SearchResultsProps) => {
  const [results, setResults] = useState<SearchResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const { userRole } = useAuth()
  
  // Request cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

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
        const studentResults = await studentSearch(query, 'all', 10)
        searchResults = {
          ...studentResults,
          students: [] // Ensure students array is empty for students
        }
      } else {
        // Placement officers and admins can search everything
        searchResults = await search(query, 'all', 10)
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
  }, [query, userRole])

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults(null)
      return
    }

    const timeoutId = setTimeout(performSearch, 500) // Increased debounce to 500ms
    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isOpen, onClose])

  const handleResultClick = (result: SearchResult) => {
    onClose()
    
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
        return <User className="w-4 h-4 text-blue-500" />
      case 'job':
        return <Briefcase className="w-4 h-4 text-green-500" />
      case 'company':
        return <Building2 className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4 text-gray-500" />
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

  if (!isOpen) return null

  const searchResultsContent = (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed z-50 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl max-h-96 overflow-hidden"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          minWidth: '320px',
          maxWidth: '90vw',
          maxHeight: '70vh'
        }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200/50 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Search results for "{query}"
            </span>
            {isLoading && (
              <div className="ml-auto w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {error && (
            <div className="p-4 text-center text-red-600 text-sm">
              {error}
            </div>
          )}

          {!isLoading && !error && results && results.total === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found for "{query}"</p>
            </div>
          )}

          {results && results.total > 0 && (
            <div className="p-2">
              {/* Students */}
              {results.students.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Students ({results.students.length})
                  </div>
                  {results.students.map((student) => (
                    <motion.div
                      key={student.id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                      onClick={() => handleResultClick(student)}
                      className="p-3 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3">
                        {getResultIcon(student.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {highlightMatch(student.name, query)}
                            </p>
                            {student.isPlaced && (
                              <Star className="w-3 h-3 text-green-500 fill-current" />
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3 h-3" />
                              {student.rollNumber}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {student.department}
                            </span>
                            {student.cgpa && (
                              <span>CGPA: {student.cgpa}</span>
                            )}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Matched in: {getMatchFieldLabel(student.matchField)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Jobs */}
              {results.jobs.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Jobs ({results.jobs.length})
                  </div>
                  {results.jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      whileHover={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}
                      onClick={() => handleResultClick(job)}
                      className="p-3 rounded-lg cursor-pointer hover:bg-green-50/50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3">
                        {getResultIcon(job.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {highlightMatch(job.name, query)}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            Matched in: {getMatchFieldLabel(job.matchField)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Companies */}
              {results.companies.length > 0 && (
                <div className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Companies ({results.companies.length})
                  </div>
                  {results.companies.map((company) => (
                    <motion.div
                      key={company.id}
                      whileHover={{ backgroundColor: 'rgba(147, 51, 234, 0.05)' }}
                      onClick={() => handleResultClick(company)}
                      className="p-3 rounded-lg cursor-pointer hover:bg-purple-50/50 transition-colors duration-200"
                    >
                      <div className="flex items-start gap-3">
                        {getResultIcon(company.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {highlightMatch(company.name, query)}
                          </p>
                          <div className="text-xs text-gray-500 mt-1">
                            Matched in: {getMatchFieldLabel(company.matchField)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {results && results.total > 0 && (
          <div className="p-3 border-t border-gray-200/50 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {results.total} result{results.total !== 1 ? 's' : ''} found
              </div>
              <button
                onClick={() => {
                  onClose()
                  navigate(`/search?q=${encodeURIComponent(query)}`)
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Results
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )

  return createPortal(searchResultsContent, document.body)
}

export default SearchResults
