import superagent from 'superagent';
import cheerio from 'cheerio';
import _ from 'lodash';
import Logger from './logger';
import { LOG_MODE } from '../config';

const log = new Logger({
  mode: LOG_MODE,
});

const getBestQuality = (infoArr) => {
  const qs = [];
  const ins = [];
  for (const info of infoArr) {
    if (info.videoUrl.length > 0) {
      qs.push(info);
      ins.push(parseInt(info.quality, 10));
    }
  }
  const m = _.max(ins);
  if (m) {
    for (const info of infoArr) {
      if (m === parseInt(info.quality, 10)) {
        return info.videoUrl;
      }
    }
  } else {
    return '';
  }
};

exports.getDownloadUrlFromPageUrl = function (pageUrl) {
  const pm = new Promise((resolve, reject) => {
    superagent
      .get(pageUrl)
      .timeout({
        response: 30 * 1000,
        deadline: 60 * 1000,
      })
      .end((err, res) => {
        if (err) {
          // reject(err);
          log.warn('throw an error! download next page!');
          log.error(err.message);
          resolve('');
        }
        const startIndex = res.text.indexOf('mediaDefinitions');
        const endIndex = res.text.indexOf('video_unavailable_country');
        let str = res.text.substring(startIndex, endIndex);
        str = str.substring(18, str.length - 2);
        try {
          const infoArr = JSON.parse(str);
          resolve(getBestQuality(infoArr));
        } catch (error) {
          log.warn('Throw an error! Download next one!');
          log.error(error.message);
          // reject(error);
          resolve('');
        }
      });
  });
  return pm;
};