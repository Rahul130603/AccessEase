# Keep website keys on Render

Website keys have no time expiry. They remain valid until revoked, for their
registered origin. No payment is required to generate or validate a live key.
The one-hour `lastUsed` interval only limits statistics writes.

Accounts, websites and key hashes are stored in `platform.json` inside
`PLATFORM_DATA_DIR`. Render Free uses an ephemeral filesystem: restarting,
spinning down or redeploying can remove that file. Changing key expiry cannot
prevent this data loss.

For the current Docker deployment:

1. In Render, select a paid instance that supports persistent disks. This is a
   billing choice the account owner must make; no purchase is performed by code.
2. Add a persistent disk with mount path `/app/data`.
3. Set `PLATFORM_DATA_DIR=/app/data` in Environment and use one service instance.
4. Deploy. Only data stored under the disk mount survives future restarts/deploys.
5. If the old ephemeral data has already disappeared, register the websites and
   generate their keys once more, then update each website's embed snippet.
   Existing tokens cannot be recovered from the source repository.

Back up `platform.json` privately. Copy existing data before a destructive
migration if it is still available. Never commit it, admin credentials or keys.

Render reference: https://render.com/docs/disks
Free service limits: https://render.com/docs/free
