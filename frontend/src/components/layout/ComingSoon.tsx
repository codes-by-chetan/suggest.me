import type React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Construction, Clock, Sparkles, ArrowLeft } from "lucide-react"
import { useNavigate } from "@tanstack/react-router"

interface ComingSoonProps {
  title: string
  description: string
  icon?: React.ReactNode
  estimatedDate?: string
  features?: string[]
  showBackButton?: boolean
}

export default function ComingSoon({
  title,
  description,
  icon,
  estimatedDate,
  features = [],
  showBackButton = true,
}: ComingSoonProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mx-auto pb-[10vh] pt-0 px-4 sm:px-6 lg:px-8"
    >
      <div className="py-6">
        <div className="flex justify-center items-center min-h-[60vh]">
          <Card className="w-full max-w-2xl mx-auto shadow-social dark:shadow-social-dark border-0">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6"
              >
                {icon || <Construction className="h-12 w-12 text-primary" />}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="text-3xl font-bold text-foreground mb-3"
              >
                {title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="text-muted-foreground mb-6 leading-relaxed text-lg"
              >
                {description}
              </motion.p>

              {estimatedDate && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="flex items-center justify-center gap-2 mb-6 p-3 bg-primary/5 rounded-full"
                >
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Expected: {estimatedDate}</span>
                </motion.div>
              )}

              {features.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.3 }}
                  className="mb-8"
                >
                  <h3 className="text-lg font-semibold mb-4 flex items-center justify-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Coming Features
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {features.map((feature, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                        className="flex items-center gap-2 p-3 bg-accent/50 rounded-lg"
                      >
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        <span className="text-sm text-foreground">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {showBackButton && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                  className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                  <Button onClick={() => navigate({ to: '..', replace: true }) } variant="outline" className="rounded-full gap-2" size="lg">
                    <ArrowLeft className="h-4 w-4" />
                    Go Back
                  </Button>
                  <Button onClick={() => navigate({to: "/"})} className="rounded-full gap-2" size="lg">
                    <Sparkles className="h-4 w-4" />
                    Explore Other Features
                  </Button>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.3 }}
                className="mt-8 pt-6 border-t border-border"
              >
                <p className="text-xs text-muted-foreground">
                  We're working hard to bring you the best experience. Stay tuned for updates!
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  )
}
