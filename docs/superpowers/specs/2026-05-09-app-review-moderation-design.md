# App Review Moderation Compliance Design

## Goal

Implement the remaining App Review safety requirements for user-generated content:
blocking abusive users, removing objectionable content from user-visible feeds, making Terms explicit, and ensuring reports/blocks reach moderation.

## Approach

Use the existing Firebase/Expo architecture. Keep the implementation small and auditable:

- Cloud Functions remain the authority for moderation notifications and server-side cleanup.
- Firestore rules enforce basic banned-user and block-list write restrictions.
- Client state filters blocked users immediately so the user sees content disappear without waiting for a round trip.
- Existing report flow is reused where possible instead of adding a separate moderation inbox.

## Data Model

Users gain an optional `blockedUserIds: string[]` field. A block only needs to be stored on the blocker user doc for immediate feed filtering. Server checks treat a message as blocked if either participant has blocked the other.

Reports remain in the existing `reports` collection. Blocks create a report-like moderation record with reason `blocked_user` so the developer receives notice and can review.

## User Flows

Users can block from:

- A chat message action.
- A friend row action.
- The report modal after submitting a report or when choosing to block.

When a block completes, the app:

- Adds the blocked uid to local `blockedUserIds`.
- Removes that user's DM room and messages from the current feed immediately.
- Removes the friendship link where applicable.
- Sends a moderation notification with context.

## Moderation Cleanup

When `moderateChatMessage` deletes an objectionable message, it also clears or recomputes `chatRooms.lastMessage`. This prevents deleted content from remaining as a stale preview in the Messages list.

A one-time cleanup script/function can be used to repair existing stale previews.

## Terms

The app Terms must explicitly say there is zero tolerance for objectionable content and abusive users, list examples of prohibited behavior, explain report/block tools, and state reports are reviewed within 24 hours.

Existing users who have not accepted the current Terms version should be routed to Terms before accessing app/social content.

## Verification

Verify on iOS simulator and, before App Review, on physical iPhone:

- New and existing users see/accept Terms before UGC.
- Reporting works from chat/friend contexts.
- Blocking hides the blocked user's DM/messages immediately.
- Offensive chat messages are deleted and do not remain in room previews.
- Banned or blocked users cannot continue messaging affected users.
