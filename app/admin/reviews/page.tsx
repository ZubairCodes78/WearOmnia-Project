import { ReviewsClient } from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default function AdminReviewsPage() {
  return <ReviewsClient initialReviews={[]} />;
}
