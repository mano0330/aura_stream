import { handler } from '../apps/api/src/vercel';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
