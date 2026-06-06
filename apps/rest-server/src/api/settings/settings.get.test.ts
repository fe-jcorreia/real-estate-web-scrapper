import { RequestMaker } from '@test/request-maker.test';
import { expect } from 'chai';

describe('GET /settings', () => {
  const endpoint = '/settings';
  let requestMaker: RequestMaker<void>;

  before(() => {
    requestMaker = new RequestMaker();
  });

  it('should return settings successfully', async () => {
    const response = await requestMaker.get({ endpoint });

    expect(response.data).to.be.deep.eq({
      forceUpdate: {
        android: { latest: 20, required: 10 },
        ios: { latest: 20, required: 10 },
      },
    });
  });
});
