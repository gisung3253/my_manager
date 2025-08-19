'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [automationEmails, setAutomationEmails] = useState(true)
  const [useFileName, setUseFileName] = useState(false)
  const [weeklyGoal, setWeeklyGoal] = useState(3)

  return (
    <div className="h-full p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
        
        <div className="space-y-8">
          {/* 이메일 주소 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Address</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2">Current Email</label>
                <div className="text-gray-900">gisung3013@gmail.com</div>
              </div>
              <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                Change Email Address
              </button>
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
            <div className="space-y-4">
              <button className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                Change Password
              </button>
              <div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Forgot Password? Send Reset Link
                </button>
              </div>
            </div>
          </div>

          {/* 이메일 설정 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Automation Emails</div>
                  <div className="text-sm text-gray-600">Helpful reminders when you haven't posted or connected accounts</div>
                </div>
                <button
                  onClick={() => setAutomationEmails(!automationEmails)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    automationEmails ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      automationEmails ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 비디오 설정 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Video Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Use file name as caption</div>
                  <div className="text-sm text-gray-600">Automatically use the video file name as the initial caption</div>
                </div>
                <button
                  onClick={() => setUseFileName(!useFileName)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useFileName ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useFileName ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* 주간 목표 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Posting Goal</h3>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={weeklyGoal}
                onChange={(e) => setWeeklyGoal(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="50"
              />
              <span className="text-gray-600">posts per week</span>
              <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}