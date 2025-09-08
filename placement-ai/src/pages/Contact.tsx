import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Send,
  MessageCircle,
  HelpCircle,
  FileText
} from 'lucide-react'
import Layout from '../components/layout/Layout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useToastNotifications } from '../components/ui/Toast'

const Contact = () => {
  const { success, error } = useToastNotifications()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      success('Message sent!', 'We\'ll get back to you within 24 hours')
      setFormData({ name: '', email: '', subject: '', message: '', type: 'general' })
    } catch (err) {
      error('Failed to send message', 'Please try again later')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      details: ['support@placementportal.com', 'info@placementportal.com'],
      description: 'Send us an email anytime'
    },
    {
      icon: Phone,
      title: 'Phone',
      details: ['+1 (555) 123-4567', '+1 (555) 987-6543'],
      description: 'Call us during business hours'
    },
    {
      icon: MapPin,
      title: 'Address',
      details: ['123 Education Street', 'Tech City, TC 12345'],
      description: 'Visit our office'
    },
    {
      icon: Clock,
      title: 'Hours',
      details: ['Mon - Fri: 9:00 AM - 6:00 PM', 'Sat: 10:00 AM - 4:00 PM'],
      description: 'We\'re here to help'
    }
  ]

  const faqs = [
    {
      question: 'How do I create an account?',
      answer: 'Simply click on the "Sign Up" button and follow the registration process. You\'ll need to verify your email address to complete the setup.'
    },
    {
      question: 'How long does the application process take?',
      answer: 'The application process typically takes 1-2 weeks. You\'ll receive updates via email at each stage of the process.'
    },
    {
      question: 'Can I apply for multiple jobs?',
      answer: 'Yes, you can apply for as many jobs as you\'re interested in. We recommend tailoring your application for each position.'
    },
    {
      question: 'What if I forget my password?',
      answer: 'Click on "Forgot Password" on the login page and follow the instructions to reset your password via email.'
    },
    {
      question: 'How do I update my profile?',
      answer: 'Go to your profile page and click "Edit Profile" to update your information, skills, and experience.'
    },
    {
      question: 'Is there a mobile app?',
      answer: 'Yes, our platform is fully responsive and works great on mobile devices. We also have mobile apps available for iOS and Android.'
    }
  ]

  return (
    <Layout title="Contact Us" subtitle="We're here to help">
      <div className="max-w-7xl mx-auto">
        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {contactInfo.map((info, index) => {
            const Icon = info.icon
            return (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center h-full">
                  <Icon className="w-8 h-8 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {info.title}
                  </h3>
                  {info.details.map((detail, idx) => (
                    <p key={idx} className="text-gray-600 text-sm mb-1">
                      {detail}
                    </p>
                  ))}
                  <p className="text-gray-500 text-xs mt-2">
                    {info.description}
                  </p>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send us a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    name="name"
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    label="Email Address"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <Input
                  name="subject"
                  label="Subject"
                  placeholder="What's this about?"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Tell us how we can help you..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </Card>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
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

              <div className="mt-8 p-4 bg-primary-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <HelpCircle className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      Still need help?
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Live Chat
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Additional Resources */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16"
        >
          <Card className="p-8 bg-gradient-to-r from-gray-50 to-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Additional Resources
              </h2>
              <p className="text-gray-600">
                Explore our help center and documentation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <FileText className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Help Center
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Comprehensive guides and tutorials
                </p>
                <Button variant="outline" size="sm">
                  Browse Articles
                </Button>
              </div>

              <div className="text-center">
                <MessageCircle className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Community Forum
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Connect with other users and get help
                </p>
                <Button variant="outline" size="sm">
                  Join Discussion
                </Button>
              </div>

              <div className="text-center">
                <HelpCircle className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Video Tutorials
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Step-by-step video guides
                </p>
                <Button variant="outline" size="sm">
                  Watch Videos
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </Layout>
  )
}

export default Contact
