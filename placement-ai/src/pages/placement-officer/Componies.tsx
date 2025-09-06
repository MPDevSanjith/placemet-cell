import Layout from '../../components/Layout'
import NewJobPost from './NewJobPost'

export default function ComponiesPage() {
  return (
    <Layout title="Componies" subtitle="Manage job postings and requests">
      <div className="max-w-7xl mx-auto p-4">
        <NewJobPost />
      </div>
    </Layout>
  )
}


