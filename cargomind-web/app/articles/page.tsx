import { FeaturedArticle } from "@/components/articles/featured-article"
import { ArticleList } from "@/components/articles/article-list"
import { ArticleCard } from "@/components/articles/article-card"
import { Button } from "@/components/ui/button"
import { ArrowRight, X } from "lucide-react"
import { ARTICLES, getArticlesByTag, getArticlesByKeyword } from "@/lib/articles-data"
import Link from "next/link"

export default async function ArticlesPage({
    searchParams,
}: {
    searchParams: Promise<{ tag?: string; keyword?: string }>
}) {
    // Get filter parameters
    const params = await searchParams
    const tagFilter = params.tag
    const keywordFilter = params.keyword

    // Filter articles based on search params
    let filteredArticles = ARTICLES
    let filterLabel = ""

    if (tagFilter) {
        filteredArticles = getArticlesByTag(tagFilter)
        filterLabel = `Tag: ${tagFilter}`
    } else if (keywordFilter) {
        filteredArticles = getArticlesByKeyword(keywordFilter)
        filterLabel = `Keyword: ${keywordFilter}`
    }

    const isFiltered = tagFilter || keywordFilter
    const hasResults = filteredArticles.length > 0

    // Use the first article as featured
    const featuredArticle = filteredArticles[0]

    // Use the next 3 articles for the side list
    const sideArticles = filteredArticles.slice(1, 4)

    // Use the rest for the bottom grid
    const bottomArticles = filteredArticles.slice(4)

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold tracking-tight">Market Insights & Logistics News</h1>
                        {isFiltered && (
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm">
                                <span className="text-blue-700 font-medium">{filterLabel}</span>
                                <Link href="/articles">
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-blue-100">
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                    {!isFiltered && (
                        <Button variant="ghost" className="gap-2">
                            View All News <ArrowRight className="h-4 w-4" />
                        </Button>
                    )}
                    {isFiltered && (
                        <Link href="/articles">
                            <Button variant="outline" className="gap-2">
                                Clear Filter
                            </Button>
                        </Link>
                    )}
                </div>

                {/* No Results Message */}
                {isFiltered && !hasResults && (
                    <div className="text-center py-16">
                        <p className="text-lg text-muted-foreground mb-4">No articles found for "{filterLabel}"</p>
                        <Link href="/articles">
                            <Button>View All Articles</Button>
                        </Link>
                    </div>
                )}

                {/* Articles Display */}
                {hasResults && (
                    <>
                        {/* Top Section: Featured + List */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                            {/* Featured Article - Takes up 2 columns on large screens */}
                            <div className="lg:col-span-2">
                                <FeaturedArticle {...featuredArticle} />
                            </div>

                            {/* Side List - Takes up 1 column on large screens */}
                            {sideArticles.length > 0 && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-semibold border-b pb-2">
                                        {isFiltered ? "Related Articles" : "Trending Now"}
                                    </h2>
                                    <ArticleList articles={sideArticles} />
                                </div>
                            )}
                        </div>

                        {/* Bottom Section: Grid */}
                        {bottomArticles.length > 0 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold border-b pb-2">More Insights</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {bottomArticles.map((article) => (
                                        <ArticleCard key={article.slug} {...article} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

            </div>
        </div>
    )
}
