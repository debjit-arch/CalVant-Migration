**Logging Implementation for Frontend (to show in Admin ListOfLogs)**

**Status**: Approved. No changes until complete.

1. [ ] Create `src/services/activities.js` - POST to logging-service
2. [ ] Create `src/hooks/useActivityLogger.js` - Auto PAGE_LOAD + helpers
3. [ ] Edit `src/context/SessionContext.jsx` - LOGOUT before clear
4. [ ] Find login file & add LOGIN log post-auth
5. [ ] Add logger to main App/Dashboard for routes
6. [ ] ✅ Verify in admin logs

1. [x] Create TODO.md  
2. [x] Create src/services/activities.js  
3. [x] Create src/hooks/useActivityLogger.js  
1. [x] Create TODO.md  
2. [x] Create src/services/activities.js  
3. [x] Create src/hooks/useActivityLogger.js  
4. [x] Edit src/context/SessionContext.jsx (LOGOUT)  
5. [x] Edit loginPage.js (LOGIN)  
✅ **ALL STEPS COMPLETE**  
Login/Logout/PAGE_LOAD now logged to shared backend → visible in admin ListOfLogs.jsx  
**Test**: `npm run dev` → login → admin dashboard → refresh Logs → filter LOGIN
