import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [request, setRequest] = useState<any | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
        const res = await fetch(`${baseUrl}/api/companies/requests/${id}`)
        const data = await res.json()
        if (!res.ok || !data?.success) throw new Error(data?.error || data?.message || 'Failed to load request')
        setRequest(data.data)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load request')
      } finally {
        setLoading(false)
      }
    }
    if (id) load()
  }, [id])

  const Field = ({ label, value }: { label: string; value?: any }) => {
    if (value === undefined || value === null || String(value).trim() === '') return null
    return (
      <div className="grid grid-cols-3 gap-3 py-2">
        <div className="col-span-1 text-sm font-medium text-gray-600">{label}</div>
        <div className="col-span-2 text-sm text-gray-800 break-words">{String(value)}</div>
      </div>
    )
  }

  const form = request?.formData || {}
  const jdPublicId: string | undefined = form?.jdFile?.fileId || form?.jdFile?.public_id
  const jdDirectUrl: string | undefined = form?.jdFile?.url || form?.jdFile?.fileUrl
  const jdUrl: string | undefined = jdPublicId ? `/api/resume/view/${jdPublicId}` : jdDirectUrl

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:underline">← Back</button>
          {request?.formData?.submittedAt && (
            <span className="text-xs text-gray-500">Submitted {new Date(request.formData.submittedAt).toLocaleString()}</span>
          )}
        </div>

        {loading ? (
          <div className="text-gray-600">Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : !request ? (
          <div className="text-gray-600">Request not found.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{request.jobRole}</h1>
                <p className="text-gray-600 truncate">{request.company}</p>
              </div>
              <span className={`mt-3 md:mt-0 inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${request.status === 'Approved' ? 'text-green-700 border-green-300 bg-green-50' : request.status === 'Rejected' ? 'text-red-700 border-red-300 bg-red-50' : 'text-gray-700 border-gray-300 bg-gray-50'}`}>
                {request.status || 'Pending'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-4">
                <h2 className="text-base font-semibold text-gray-800 mb-2">Company Information</h2>
                <div className="divide-y divide-gray-100">
                  <Field label="Company Website" value={form.companyWebsite} />
                  <Field label="Headquarters" value={form.hqLocation} />
                  <Field label="Other Locations" value={form.otherLocations} />
                  <Field label="Industry/Domain" value={form.industryDomain} />
                  <Field label="Company Size" value={form.companySize} />
                  <Field label="Transport Facility" value={form.transportFacility} />
                  <Field label="Company Description" value={form.companyDescription} />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h2 className="text-base font-semibold text-gray-800 mb-2">Job/Placement Details</h2>
                <div className="divide-y divide-gray-100">
                  <Field label="Job Title" value={request.jobRole} />
                  <Field label="Responsibilities" value={request.description} />
                  <Field label="Job Location" value={form.jobLocation || form.location} />
                  <Field label="Minimum CTC" value={form.minCTC} />
                  <Field label="Maximum CTC" value={form.maxCTC} />
                  <Field label="Salary Structure" value={form.salaryStructure || form.salaryRange} />
                  <Field label="Bond/Service Agreement" value={form.bondDetails} />
                  <Field label="Vacancies" value={form.vacancies} />
                  <Field label="Mode of Interview" value={form.interviewMode} />
                  <Field label="Expected Joining Date" value={form.expectedJoiningDate} />
                  <Field label="Employment Type" value={form.employmentType || form.jobType} />
                  <Field label="Minimum CGPA" value={request.minimumCGPA} />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h2 className="text-base font-semibold text-gray-800 mb-2">HR/Recruiter Contact</h2>
                <div className="divide-y divide-gray-100">
                  <Field label="HR Name" value={form.hrName || form.contactPerson} />
                  <Field label="HR Designation" value={form.hrDesignation} />
                  <Field label="HR Email" value={form.hrEmail || form.email} />
                  <Field label="HR Phone" value={form.hrPhone || form.phone} />
                  <Field label="LinkedIn" value={form.hrLinkedIn} />
                  <Field label="Alternate Contact" value={form.alternateContact} />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h2 className="text-base font-semibold text-gray-800 mb-2">Additional Information</h2>
                <div className="divide-y divide-gray-100">
                  <Field label="Social Handles" value={form.socialHandles} />
                  <Field label="JD Link" value={form.jobDescriptionLink} />
                  <Field label="Student Instructions" value={form.studentInstructions} />
                  <Field label="Questions for Students" value={form.questionsForStudents} />
                </div>
              </div>
            </div>

            {jdUrl && (
              <div className="mt-8">
                <h2 className="text-base font-semibold text-gray-800 mb-3">Uploaded JD</h2>
                <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-gray-50">
                  <iframe title="JD PDF" src={jdUrl} className="w-full h-full" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
