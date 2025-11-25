import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, Calendar } from "lucide-react"
import { getArticleBySlug, getRelatedArticles } from "@/lib/articles-data"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArticleCard } from "@/components/articles/article-card"

interface ArticlePageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
    const { slug } = await params
    const article = getArticleBySlug(slug)

    if (!article) {
        return {
            title: "Article Not Found",
        }
    }

    return {
        title: `${article.title} | CargoBloom`,
        description: article.metaDescription,
        keywords: article.keywords,
        openGraph: {
            title: article.title,
            description: article.metaDescription,
            images: [article.imageUrl],
            type: "article",
        },
    }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
    const { slug } = await params
    const article = getArticleBySlug(slug)

    if (!article) {
        notFound()
    }

    const relatedArticles = getRelatedArticles(slug)

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Hero Section */}
            <div className="relative h-[400px] md:h-[500px] w-full">
                <Image
                    src={article.imageUrl}
                    alt={article.title}
                    fill
                    className="object-cover brightness-50"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-[1000px] mx-auto">
                    <Link href="/articles">
                        <Button variant="secondary" size="sm" className="mb-6 gap-2">
                            <ArrowLeft className="h-4 w-4" /> Back to Articles
                        </Button>
                    </Link>

                    <div className="flex flex-wrap gap-2 mb-4">
                        {article.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-sm">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center gap-4 text-gray-200 text-sm md:text-base">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                                <span className="font-bold text-primary">{article.source[0]}</span>
                            </div>
                            <span className="font-medium">{article.source}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{article.timeAgo}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-[800px] mx-auto px-4 md:px-8 py-12">
                <article
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />
            </div>

            {/* Related Articles */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-12 border-t">
                <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {relatedArticles.map((relatedArticle) => (
                        <ArticleCard key={relatedArticle.slug} {...relatedArticle} />
                    ))}
                </div>
            </div>
        </div>
    )
}
