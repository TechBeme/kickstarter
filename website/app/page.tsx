import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Users, Folder, TrendingUp, Search, Filter, MessageCircle, Star, Target, Zap, Shield, BarChart3, Mail, ExternalLink, Github, Briefcase } from 'lucide-react'
import Image from 'next/image'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { supabaseServer } from '@/lib/supabase-server'

async function getHomeData() {
  try {
    const { data, error } = await (supabaseServer as any).rpc('get_home_data')

    if (error || !data) {
      throw new Error(error?.message || 'Failed to fetch home data')
    }

    return {
      stats: {
        projects: data.stats?.total_projects || 0,
        creators: data.stats?.total_creators || 0,
        totalGoal: data.stats?.total_funding_goal || 0
      },
      topProjects: data.top_projects || [],
      topCreators: data.top_creators || []
    }
  } catch (error) {
    console.error('Error loading home data:', error)
    return {
      stats: { projects: 0, creators: 0, totalGoal: 0 },
      topProjects: [],
      topCreators: []
    }
  }
}

export default async function Home() {
  const homeData = await getHomeData()
  const { stats, topProjects, topCreators } = homeData

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="text-center space-y-6 py-12 md:py-20">
        <Badge variant="secondary" className="mb-2">
          <Zap className="h-3 w-3 mr-1" />
          The Ultimate Kickstarter Creator Database
        </Badge>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-tight">
          Discover & Partner with{' '}
          <span className="text-[#05CE78]">Kickstarter Creators</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Access a comprehensive database of Kickstarter creators and upcoming projects.
          Find partners, analyze campaigns, track metrics, and manage outreach—all in one platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Link href="/projects">
            <Button size="lg" className="gap-2 bg-[#05CE78] hover:bg-[#04b869] text-white">
              <Search className="h-5 w-5" />
              Explore Projects
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/creators">
            <Button size="lg" variant="outline" className="gap-2">
              <Users className="h-5 w-5" />
              Browse Creators
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-12">
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#05CE78]/10 flex items-center justify-center">
                <Folder className="h-7 w-7 text-[#05CE78]" />
              </div>
              <div className="text-3xl font-bold">{stats.projects.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Projects Tracked</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#05CE78]/10 flex items-center justify-center">
                <Users className="h-7 w-7 text-[#05CE78]" />
              </div>
              <div className="text-3xl font-bold">{stats.creators.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-1">Verified Creators</div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-lg">
            <CardContent className="pt-6 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#05CE78]/10 flex items-center justify-center">
                <TrendingUp className="h-7 w-7 text-[#05CE78]" />
              </div>
              <div className="text-3xl font-bold">${(stats.totalGoal / 1000000).toFixed(1)}M</div>
              <div className="text-sm text-muted-foreground mt-1">Total Funding Goals</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Why Use This Platform?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to discover, analyze, and connect with Kickstarter creators
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Filter className="h-10 w-10 mb-3 text-[#05CE78]" />
              <CardTitle>Advanced Filtering</CardTitle>
              <CardDescription>
                Search by category, funding goals, location, social media presence, and more.
                Find exactly the creators you're looking for.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 mb-3 text-[#05CE78]" />
              <CardTitle>Campaign Metrics</CardTitle>
              <CardDescription>
                Track funding goals, project categories, and campaign details.
                Make data-driven partnership decisions.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MessageCircle className="h-10 w-10 mb-3 text-[#05CE78]" />
              <CardTitle>Outreach Management</CardTitle>
              <CardDescription>
                Organize your communication with creators. Track contact status,
                follow-ups, and partnership progress.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Star className="h-10 w-10 mb-3 text-[#05CE78]" />
              <CardTitle>Verified Data</CardTitle>
              <CardDescription>
                All creator and project information synced directly from Kickstarter.
                Always accurate and up-to-date.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Target className="h-10 w-10 mb-3 text-[#05CE78]" />
              <CardTitle>Social Media Insights</CardTitle>
              <CardDescription>
                Discover creators with strong social presence across Instagram, YouTube,
                Twitter, TikTok, and more.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 mb-3 text-[#05CE78]" />
              <CardTitle>Partnership Focused</CardTitle>
              <CardDescription>
                Built specifically for businesses looking to collaborate with
                creators and innovators.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Top Projects Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Projects</h2>
            <p className="text-muted-foreground">Explore upcoming Kickstarter campaigns</p>
          </div>
          <Link href="/projects">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topProjects.map((project: any) => {
            const photo = project.photo as any
            const imageUrl = photo?.small || photo?.thumb || '/placeholder-project.png'

            return (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative w-full h-48">
                    <Image
                      src={imageUrl}
                      alt={project.name}
                      fill
                      className="object-cover rounded-t-lg"
                      unoptimized
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.blurb}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Funding Goal</span>
                        <span className="font-bold text-[#05CE78]">
                          {project.currency_symbol}{project.goal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Category</span>
                        <Badge variant="secondary">{(project.category as any)?.name || 'Other'}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Country</span>
                        <span className="font-semibold">{project.country}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Top Creators Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Featured Creators</h2>
            <p className="text-muted-foreground">Connect with the most active Kickstarter backers and creators</p>
          </div>
          <Link href="/creators">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topCreators.map((creator: any) => {
            const avatar = creator.avatar as any

            return (
              <Link key={creator.id} href={`/creators/${creator.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <Image
                          src={avatar?.thumb || '/placeholder-avatar.png'}
                          alt={creator.name}
                          fill
                          className="object-cover rounded-full"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="line-clamp-1">{creator.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">@{creator.slug || creator.id}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {creator.is_superbacker && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Superbacker
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Backed Projects</span>
                        <span className="font-semibold">{creator.backing_action_count || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Custom Automation Services Section */}
      <section className="space-y-8 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10">
        <div className="text-center space-y-4">
          <Badge variant="secondary" className="mb-2">
            <Briefcase className="h-3 w-3 mr-1" />
            Portfolio Project
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Need Custom Automation?</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            <strong className="text-foreground">Looking for a tailored automation solution for your business?</strong>
            <br />
            I specialize in building high-quality, production-ready automation systems like this one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Web Scraping</CardTitle>
              <CardDescription className="text-sm">
                Extract data from any website with custom scrapers
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Automation</CardTitle>
              <CardDescription className="text-sm">
                Automate repetitive tasks and business workflows
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <CardTitle className="text-lg">Website Development</CardTitle>
              <CardDescription className="text-sm">
                Build modern web applications and dashboards
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">AI Integrations</CardTitle>
              <CardDescription className="text-sm">
                Connect AI models to your applications
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/30 shadow-lg">
            <CardHeader className="text-center">
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20">
                  <Image
                    src="/profile.webp"
                    alt="Rafael Vieira"
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Rafael Vieira</h3>
                  <p className="text-muted-foreground">Full-Stack Developer & AI Automation Specialist</p>
                  <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                    <span>🇺🇸 English</span>
                    <span>•</span>
                    <span>🇪🇸 Español</span>
                    <span>•</span>
                    <span>🇧🇷 Português</span>
                  </div>
                </div>
              </div>
              <div className="max-w-2xl mx-auto">
                <p className="text-lg font-medium text-primary italic text-center">
                  "Step into the AI era now, don't get left behind"
                </p>
              </div>
              <CardTitle className="text-xl md:text-2xl">
                Let's Work Together
              </CardTitle>
              <CardDescription>
                From simple scripts to complex enterprise solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  href="https://www.fiverr.com/tech_be"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 group-hover:border-primary group-hover:bg-primary/5">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Fiverr - Tech_Be</div>
                      <div className="text-xs text-muted-foreground">Freelance Services</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </a>

                <a
                  href="https://www.upwork.com/freelancers/~01f0abcf70bbd95376"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 group-hover:border-primary group-hover:bg-primary/5">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Upwork Profile</div>
                      <div className="text-xs text-muted-foreground">Freelance Services</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </a>

                <a
                  href="https://github.com/TechBeme"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 group-hover:border-primary group-hover:bg-primary/5">
                    <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center flex-shrink-0">
                      <Github className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">GitHub - TechBeme</div>
                      <div className="text-xs text-muted-foreground">Open Source Projects</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </a>

                <a
                  href="mailto:contact@techbe.me"
                  className="group"
                >
                  <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4 group-hover:border-primary group-hover:bg-primary/5">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">contact@techbe.me</div>
                      <div className="text-xs text-muted-foreground">Email Me Directly</div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </Button>
                </a>
              </div>

              <div className="pt-4 text-center">
                <Badge variant="secondary" className="text-sm py-2 px-4">
                  💡 Get a free quote for your automation needs!
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Everything you need to know about this platform
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger className="text-left">
              What is this platform?
            </AccordionTrigger>
            <AccordionContent>
              This is a comprehensive platform that helps businesses and marketers discover,
              analyze, and connect with Kickstarter creators. We provide detailed information
              about upcoming projects, creators, funding goals, social media presence, and tools to manage
              partnership outreach.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2">
            <AccordionTrigger className="text-left">
              How is the data collected and updated?
            </AccordionTrigger>
            <AccordionContent>
              All project and creator data is sourced directly from Kickstarter's official platform.
              We continuously sync information to ensure accuracy, including campaign details,
              creator profiles, funding goals, and social media links. The database
              is regularly updated to reflect the latest information.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3">
            <AccordionTrigger className="text-left">
              Can I filter creators by social media presence?
            </AccordionTrigger>
            <AccordionContent>
              Yes! One of our most powerful features is the ability to filter creators based on their
              social media presence. You can search for creators who have Instagram, YouTube, Twitter/X,
              TikTok, LinkedIn, Patreon, Discord, Twitch, Bluesky, or other websites. This helps you
              find creators with established audiences across specific platforms.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4">
            <AccordionTrigger className="text-left">
              What can I use the outreach management features for?
            </AccordionTrigger>
            <AccordionContent>
              The outreach management system allows you to track your communication with creators.
              You can mark contacts as "Not Contacted", "Email Sent", "Follow Up 1/2", "Responded",
              "Interested", "Not Interested", "No Response", or "Partnership". This helps you organize
              your partnership pipeline and never lose track of important conversations.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5">
            <AccordionTrigger className="text-left">
              How can I find creators in specific categories or locations?
            </AccordionTrigger>
            <AccordionContent>
              Our advanced filtering system lets you search by multiple criteria including project
              category (Games, Technology, Art, Design, etc.), location (country and state), funding
              goals, and more. You can combine multiple filters to find exactly the
              type of creators you want to partner with.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6">
            <AccordionTrigger className="text-left">
              Can I see a creator's project history?
            </AccordionTrigger>
            <AccordionContent>
              Absolutely! Each creator profile shows all their Kickstarter projects and
              the number of projects they've backed. You can see funding goals and detailed
              information for each project to better understand the creator's track record
              and engagement level.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7">
            <AccordionTrigger className="text-left">
              Is this platform affiliated with Kickstarter?
            </AccordionTrigger>
            <AccordionContent>
              This platform is independent and is not officially affiliated with or
              endorsed by Kickstarter. We are a third-party tool designed to help businesses and
              marketers discover partnership opportunities with creators who use the Kickstarter platform.
              All Kickstarter trademarks and data belong to their respective owners.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* CTA Section */}
      <section className="text-center space-y-6 py-12 bg-gradient-to-br from-[#05CE78]/10 to-transparent rounded-2xl">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to Find Your Next Partner?</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join businesses discovering creators for partnerships, collaborations, and growth opportunities.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/projects">
            <Button size="lg" className="gap-2 bg-[#05CE78] hover:bg-[#04b869]">
              <Search className="h-5 w-5" />
              Start Exploring
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/creators">
            <Button size="lg" variant="outline" className="gap-2">
              <Users className="h-5 w-5" />
              View All Creators
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
