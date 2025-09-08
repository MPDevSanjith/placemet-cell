import { motion } from 'framer-motion'
import { 
  Users, 
  Target, 
  Award, 
  TrendingUp,
  Globe,
  Heart,
  Building
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const AboutUs = () => {
  const stats = [
    { icon: Users, label: 'Students Placed', value: '10,000+', color: 'text-blue-600' },
    { icon: Building, label: 'Partner Companies', value: '500+', color: 'text-green-600' },
    { icon: Award, label: 'Success Rate', value: '95%', color: 'text-purple-600' },
    { icon: TrendingUp, label: 'Average Salary', value: '₹8.5L', color: 'text-orange-600' }
  ]

  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, ensuring the highest quality service for our students and partners.'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'We believe in the power of collaboration between students, companies, and our team to achieve mutual success.'
    },
    {
      icon: Award,
      title: 'Innovation',
      description: 'We continuously innovate our processes and technology to stay ahead in the rapidly evolving job market.'
    },
    {
      icon: Heart,
      title: 'Integrity',
      description: 'We maintain the highest standards of integrity and transparency in all our interactions and processes.'
    }
  ]

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Director',
      image: '/api/placeholder/150/150',
      description: '15+ years in career development and placement services'
    },
    {
      name: 'Michael Chen',
      role: 'Head of Technology',
      image: '/api/placeholder/150/150',
      description: 'Expert in AI-driven job matching and platform development'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Student Success Manager',
      image: '/api/placeholder/150/150',
      description: 'Dedicated to helping students achieve their career goals'
    },
    {
      name: 'David Kumar',
      role: 'Industry Relations',
      image: '/api/placeholder/150/150',
      description: 'Building strong partnerships with leading companies'
    }
  ]

  return (
    <Layout title="About Us" subtitle="Connecting talent with opportunity">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Bridging the Gap Between{' '}
            <span className="text-primary-600">Talent</span> and{' '}
            <span className="text-primary-600">Opportunity</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are a leading placement platform dedicated to connecting talented students 
            with top-tier companies, fostering meaningful careers and driving innovation 
            in the job market.
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="text-center p-6">
                  <Icon className={`w-8 h-8 mx-auto mb-4 ${stat.color}`} />
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">
                    {stat.label}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8 h-full">
              <Target className="w-12 h-12 text-primary-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To empower students with the tools, resources, and opportunities they need 
                to launch successful careers. We believe every student deserves access to 
                meaningful employment that aligns with their skills, passions, and aspirations.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8 h-full">
              <Globe className="w-12 h-12 text-primary-600 mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To become the world's most trusted platform for student placement, 
                creating a seamless ecosystem where talent meets opportunity, 
                innovation thrives, and careers flourish.
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              These core values guide everything we do and shape our culture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                >
                  <Card className="p-6 text-center h-full">
                    <Icon className="w-10 h-10 text-primary-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {value.description}
                    </p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Team */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The passionate professionals behind our success
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1 }}
              >
                <Card className="p-6 text-center">
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {member.name}
                  </h3>
                  <p className="text-primary-600 font-medium mb-2">
                    {member.role}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {member.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center"
        >
          <Card className="p-12 bg-gradient-to-r from-primary-50 to-blue-50">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Journey?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands of students who have found their dream careers through our platform. 
              Your future starts here.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                Get Started as Student
              </Button>
              <Button variant="outline" size="lg">
                Partner with Us
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default AboutUs
