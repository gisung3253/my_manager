'use client'

import { usePostCreation } from '../../context/PostCreationContext'
import YoutubeSettings from './YoutubeSettings'
import TwitterSettings from './TwitterSettings'
import InstagramSettings from './InstagramSettings'

export default function PlatformSettings() {
  const { 
    hasYouTubeAccount, 
    hasTwitterAccount, 
    hasInstagramAccount,
    postType
  } = usePostCreation()

  return (
    <div className="space-y-6">
      {/* YouTube 설정 */}
      {hasYouTubeAccount() && (
        <YoutubeSettings />
      )}

      {/* Twitter 설정 */}
      {hasTwitterAccount() && (
        <TwitterSettings />
      )}

      {/* Instagram 설정 */}
      {hasInstagramAccount() && (postType === 'image' || postType === 'video') && (
        <InstagramSettings />
      )}
    </div>
  )
}