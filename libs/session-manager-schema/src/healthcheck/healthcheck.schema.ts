import { Type } from 'typebox';

import { SHARED_ERROR_REPLY_SCHEMA } from '@scribear/base-schema';

const HEALTHCHECK_SCHEMA = {
  description: 'Probes liveliness of server',
  tags: ['Healthcheck'],
  response: {
    200: Type.Object(
      { reqId: Type.String() },
      { description: 'Healthcheck successful' },
    ),
    400: SHARED_ERROR_REPLY_SCHEMA[400],
    500: SHARED_ERROR_REPLY_SCHEMA[500],
  },
};

export { HEALTHCHECK_SCHEMA };
