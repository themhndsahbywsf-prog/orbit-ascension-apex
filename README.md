# ORBIT

ORBIT is a realtime community and communication platform evolving into a broader social, collaboration, creator, streaming and developer ecosystem.

## Run

npm install
npm start

## Foundation checks

npm test
npm run db:migrate

The migration command requires DATABASE_URL. See docs/ARCHITECTURE.md, docs/DATABASE.md, docs/SECURITY.md and docs/DEPLOYMENT.md.


## ORBIT ASCENSION APEX — interface completion

The main ORBIT home surface now opens as a unified **Command Room** that puts social presence, live rooms, direct messages, communities and high-frequency actions into one calmer control surface. Existing chat, calls, community and administration runtimes remain in place.

The platform owner console keeps its existing access controls and receives an additional visual command-center layer.

New interface layers:
- `public/orbit-command-room.css`
- `public/orbit-command-room.js`

No fake realtime data or client-side authorization was introduced; the Command Room reads the existing authenticated platform endpoints.
