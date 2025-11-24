import { FeaturedArticle } from "@/components/articles/featured-article"
import { ArticleList } from "@/components/articles/article-list"
import { ArticleCard } from "@/components/articles/article-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { ARTICLES } from "@/lib/articles-data"

export default function ArticlesPage() {
    // Use the first article as featured
    const featuredArticle = ARTICLES[0]

    // Use the next 3 articles for the side list
    const sideArticles = ARTICLES.slice(1, 4)

    // Use the rest for the bottom grid
    const bottomArticles = ARTICLES.slice(4)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Market Insights & Logistics News</h1>
                    <Button variant="ghost" className="gap-2">
                        View All News <ArrowRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Top Section: Featured + List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                    {/* Featured Article - Takes up 2 columns on large screens */}
                    <div className="lg:col-span-2">
                        <FeaturedArticle {...featuredArticle} />
                    </div>

                    {/* Side List - Takes up 1 column on large screens */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-semibold border-b pb-2">Trending Now</h2>
                        <ArticleList articles={sideArticles} />
                    </div>
                </div>

                {/* Bottom Section: Grid */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold border-b pb-2">More Insights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bottomArticles.map((article) => (
                            <ArticleCard key={article.slug} {...article} />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}
