import avatarImage1 from '@/images/avatars/Image-1.png'
import avatarImage2 from '@/images/avatars/Image-2.png'
import avatarImage3 from '@/images/avatars/Image-3.png'
import avatarImage4 from '@/images/avatars/Image-4.png'
import { blogPosts, findBlogPost } from './blogPosts'

export async function getListingReviews(handle: string) {
  return [
    {
      id: '1',
      title: "Can't say enough good things",
      rating: 5,
      content: 'Lovely hostess, very friendly! I would definitely stay here again. ',
      author: 'S. Walkinshaw',
      authorAvatar: avatarImage1,
      date: 'May 16, 2025',
      datetime: '2025-01-06',
    },
    {
      id: '2',
      title: 'Perfect for going out when you want to stay comfy',
      rating: 4,
      content: 'Excellent place. The host is super friendly, the room is clean and quiet.',
      author: 'Risako M',
      authorAvatar: avatarImage2,
      date: 'May 11, 2021',
      datetime: '2025-01-06',
    },
    {
      id: '3',
      title: 'Very nice feeling sweater!',
      rating: 5,
      content:
        'Very nice and friendly lady. Be pleasant to talk with her. The room looks better than in the pictures. ',
      author: 'Eden Birch',
      authorAvatar: avatarImage3,
      date: 'Aug 22, 2022',
      datetime: '2025-01-06',
    },
    {
      id: '4',
      title: 'Very nice feeling sweater!',
      rating: 5,
      content:
        'Lots of nice restaurants nearby and I tried two of them. I had so limited time in Paris this time and look forward to living here again.',
      author: 'Jonathan Edwards',
      authorAvatar: avatarImage4,
      date: 'May 16, 2025',
      datetime: '2025-01-06',
    },
  ]
}
export async function getBlogPosts() {
  return blogPosts
}
export async function getBlogPostsByHandle(handle: string) {
  return findBlogPost(handle)
}

//
export type TListingReivew = Awaited<ReturnType<typeof getListingReviews>>[number]
export type TBlogPost = Awaited<ReturnType<typeof getBlogPosts>>[number]
