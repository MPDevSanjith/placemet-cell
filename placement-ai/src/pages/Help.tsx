import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  User,
  Briefcase,
  DollarSign
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen },
    { id: 'getting-started', name: 'Getting Started', icon: CheckCircle },
    { id: 'account', name: 'Account & Profile', icon: User },
    { id: 'jobs', name: 'Jobs & Applications', icon: Briefcase },
    { id: 'technical', name: 'Technical Issues', icon: AlertCircle },
    { id: 'billing', name: 'Billing & Payments', icon: DollarSign }
  ]

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: CheckCircle,
      articles: [
        {
          title: 'How to create your account',
          description: 'Step-by-step guide to setting up your placement portal account',
          difficulty: 'Easy',
          readTime: '5 min'
        },
        {
          title: 'Completing your profile',
          description: 'Learn how to build a compelling profile that attracts employers',
          difficulty: 'Medium',
          readTime: '10 min'
        },
        {
          title: 'Understanding the dashboard',
          description: 'Navigate your way around the student dashboard',
          difficulty: 'Easy',
          readTime: '3 min'
        }
      ]
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: User,
      articles: [
        {
          title: 'Updating personal information',
          description: 'How to keep your personal details current and accurate',
          difficulty: 'Easy',
          readTime: '3 min'
        },
        {
          title: 'Managing privacy settings',
          description: 'Control who can see your profile and information',
          difficulty: 'Medium',
          readTime: '7 min'
        },
        {
          title: 'Account security',
          description: 'Keep your account secure with strong passwords and 2FA',
          difficulty: 'Medium',
          readTime: '8 min'
        }
      ]
    },
    {
      id: 'jobs',
      title: 'Jobs & Applications',
      icon: Briefcase,
      articles: [
        {
          title: 'Finding and applying for jobs',
          description: 'Discover opportunities and submit applications',
          difficulty: 'Easy',
          readTime: '6 min'
        },
        {
          title: 'Tracking application status',
          description: 'Monitor your applications and stay updated',
          difficulty: 'Easy',
          readTime: '4 min'
        },
        {
          title: 'Preparing for interviews',
          description: 'Tips and resources for successful interviews',
          difficulty: 'Medium',
          readTime: '12 min'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      icon: AlertCircle,
      articles: [
        {
          title: 'Troubleshooting login issues',
          description: 'Common login problems and their solutions',
          difficulty: 'Easy',
          readTime: '5 min'
        },
        {
          title: 'Browser compatibility',
          description: 'Ensure your browser works optimally with our platform',
          difficulty: 'Easy',
          readTime: '4 min'
        },
        {
          title: 'Mobile app issues',
          description: 'Fix common problems with the mobile application',
          difficulty: 'Medium',
          readTime: '6 min'
        }
      ]
    }
  ]

  const faqs = [
    {
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page and enter your email address. You\'ll receive a reset link via email.',
      category: 'account'
    },
    {
      question: 'Can I apply for multiple jobs?',
      answer: 'Yes, you can apply for as many jobs as you want. We recommend tailoring your application for each position.',
      category: 'jobs'
    },
    {
      question: 'How long does the application process take?',
      answer: 'The application process typically takes 1-2 weeks. You\'ll receive email updates at each stage.',
      category: 'jobs'
    },
    {
      question: 'What if I can\'t upload my resume?',
      answer: 'Make sure your file is in PDF, DOC, or DOCX format and under 10MB. Try using a different browser if the issue persists.',
      category: 'technical'
    },
    {
      question: 'How do I update my contact information?',
      answer: 'Go to your profile page and click "Edit Profile" to update your contact details.',
      category: 'account'
    },
    {
      question: 'Is there a mobile app?',
      answer: 'Yes, we have mobile apps for both iOS and Android. You can download them from the App Store or Google Play.',
      category: 'technical'
    }
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredSections = selectedCategory === 'all' 
    ? helpSections 
    : helpSections.filter(section => section.id === selectedCategory)

  const filteredFaqs = selectedCategory === 'all'
    ? faqs
    : faqs.filter(faq => faq.category === selectedCategory)

  return (
    <Layout title="Help Center" subtitle="Find answers and get support">
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search help articles, FAQs, and guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-lg"
              />
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{category.name}</span>
                    </button>
                  )
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Need More Help?
                </h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Live Chat
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Support
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Us
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Help Sections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Help Articles
              </h2>
              
              <div className="space-y-4">
                {filteredSections.map((section, sectionIndex) => {
                  const Icon = section.icon
                  const isExpanded = expandedSections.includes(section.id)
                  
                  return (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + sectionIndex * 0.1 }}
                    >
                      <Card>
                        <button
                          onClick={() => toggleSection(section.id)}
                          className="w-full p-6 text-left"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Icon className="w-5 h-5 text-primary-600" />
                              <h3 className="text-lg font-semibold text-gray-900">
                                {section.title}
                              </h3>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="px-6 pb-6 border-t border-gray-200"
                          >
                            <div className="space-y-3 pt-4">
                              {section.articles.map((article, articleIndex) => (
                                <motion.div
                                  key={articleIndex}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: articleIndex * 0.1 }}
                                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                                >
                                  <div className="flex-1">
                                    <h4 className="text-sm font-medium text-gray-900 mb-1">
                                      {article.title}
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      {article.description}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge className={getDifficultyColor(article.difficulty)} size="sm">
                                      {article.difficulty}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {article.readTime}
                                    </span>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              
              <Card className="p-6">
                <div className="space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">
                        {faq.question}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {faq.answer}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Contact Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Card className="p-8 bg-gradient-to-r from-primary-50 to-blue-50">
                <div className="text-center">
                  <HelpCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Still Need Help?
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Can't find what you're looking for? Our support team is here to help you 
                    with any questions or issues you might have.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Start Live Chat
                    </Button>
                    <Button variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Help
