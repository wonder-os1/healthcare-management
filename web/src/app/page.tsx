'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  ClipboardList,
  Heart,
  Shield,
  Users,
  Stethoscope,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Healthcare Management'
const PRIMARY_COLOR = process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#2563eb'

const features = [
  {
    icon: Calendar,
    title: 'Appointment Scheduling',
    description: 'Book and manage appointments with real-time slot availability and conflict prevention.',
  },
  {
    icon: ClipboardList,
    title: 'Medical Records',
    description: 'Secure digital records for diagnoses, lab results, imaging, and clinical notes.',
  },
  {
    icon: Heart,
    title: 'Patient Management',
    description: 'Complete patient profiles with history, allergies, vitals, and emergency contacts.',
  },
  {
    icon: Stethoscope,
    title: 'Prescriptions',
    description: 'Create and track prescriptions with medicine search, dosage, and duration tracking.',
  },
  {
    icon: Shield,
    title: 'Lab Integration',
    description: 'Order lab tests, track sample collection, and manage results — all in one place.',
  },
  {
    icon: Users,
    title: 'Multi-Role Access',
    description: 'Role-based dashboards for admins, doctors, staff, and patients with appropriate access controls.',
  },
]

const stats = [
  { label: 'Appointments Managed', value: '10,000+' },
  { label: 'Healthcare Providers', value: '500+' },
  { label: 'Patient Records', value: '50,000+' },
  { label: 'Uptime', value: '99.9%' },
]

export default function LandingPage() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/dashboard')
    } else {
      setChecked(true)
    }
  }, [router])

  if (!checked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7" style={{ color: PRIMARY_COLOR }} />
            <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#about" className="text-sm text-gray-600 hover:text-gray-900">About</a>
            <a href="#contact" className="text-sm text-gray-600 hover:text-gray-900">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push('/auth/login')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/auth/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: PRIMARY_COLOR }} />
        </div>
        <div className="mx-auto max-w-7xl px-6 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-gray-600">
              <CheckCircle className="h-4 w-4 text-green-500" />
              HIPAA-ready healthcare platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Modern Healthcare{' '}
              <span style={{ color: PRIMARY_COLOR }}>Management</span>{' '}
              for Your Clinic
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Streamline your clinic operations with appointment scheduling, patient records,
              prescriptions, billing, and lab management — all from one intuitive dashboard.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button size="lg" onClick={() => router.push('/auth/login')}>
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}>
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-gray-50 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <div className="mt-1 text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything You Need to Run Your Clinic
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              From patient intake to billing — manage your entire practice digitally.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-0 shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${PRIMARY_COLOR}15` }}>
                    <feature.icon className="h-5 w-5" style={{ color: PRIMARY_COLOR }} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="border-t bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                Built for Indian Healthcare
              </h2>
              <p className="mt-4 text-gray-600">
                Designed specifically for clinics, hospitals, and healthcare providers in India.
                Supports INR billing with GST, Razorpay payments, and Indian medical terminology.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  'Razorpay payment integration with UPI support',
                  'GST-compliant invoicing and billing',
                  'Indian timezone and date formatting',
                  'Multi-department and multi-doctor support',
                  'Audit-ready compliance logging',
                  'Role-based access for your entire staff',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border bg-white p-8 shadow-sm">
              <div className="space-y-6">
                <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-4">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Smart Scheduling</div>
                    <div className="text-sm text-gray-500">Conflict-free appointment slots with automated reminders</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-green-50 p-4">
                  <Shield className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Secure & Private</div>
                    <div className="text-sm text-gray-500">End-to-end encryption with role-based data access</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-purple-50 p-4">
                  <Stethoscope className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Clinical Workflows</div>
                    <div className="text-sm text-gray-500">From consultation to prescription to follow-up</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl rounded-2xl p-12 text-center text-white" style={{ backgroundColor: PRIMARY_COLOR }}>
            <h2 className="text-3xl font-bold">Ready to Digitize Your Practice?</h2>
            <p className="mt-4 text-lg text-blue-100">
              Get started in minutes. No credit card required for the trial.
            </p>
            <Button
              size="lg"
              variant="secondary"
              className="mt-8"
              onClick={() => router.push('/auth/login')}
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t bg-gray-50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-6 w-6" style={{ color: PRIMARY_COLOR }} />
                <span className="text-lg font-bold text-gray-900">{APP_NAME}</span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Modern healthcare management platform built for clinics and hospitals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Quick Links</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gray-900">Features</a></li>
                <li><a href="#about" className="hover:text-gray-900">About</a></li>
                <li><a href="/auth/login" className="hover:text-gray-900">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Contact</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> support@wonderos.in
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> +91 98765 43210
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-xs text-gray-400">
            Powered by Wonder OS
          </div>
        </div>
      </footer>
    </div>
  )
}
