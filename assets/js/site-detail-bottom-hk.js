/* ============================================================
GEO Signal Tracker — AI 유입 감지 (UTM / Referrer)
대상: Shopline HK 스토어 전체 (Foodology / OBGE / 95PROBLEM / EPAIS / FULLY)
의존: 없음 (Vanilla JS)
============================================================ */
(function () {
  var SUPABASE_URL = 'https://zsznmjvmbzqxtssqfrpj.supabase.co';
  var ANON_KEY     = 'sb_publishable_Dqx5699n2fgzAr3ijiiNCQ_WXavoaaD';

  var AI_DOMAINS = [
    'chatgpt.com', 'chat.openai.com',
    'perplexity.ai', 'claude.ai',
    'copilot.microsoft.com', 'gemini.google.com'
  ];

  var STORE_MAP = {
    'foodology.com.hk': 'foodology-hk',
    'obge.hk':           'obge-hk',
    '95problem.hk':       '95problem-hk',
    'epais.hk':           'epais-hk',
    'fully.hk':           'fully-hk'
  };

  var utmSrc   = new URLSearchParams(location.search).get('utm_source') || '';
  var referrer = document.referrer || '';

  function matchAI(str) {
    for (var i = 0; i < AI_DOMAINS.length; i++) {
      if (str.indexOf(AI_DOMAINS[i]) > -1) return AI_DOMAINS[i];
    }
    return null;
  }

  var matched = matchAI(utmSrc) || matchAI(referrer);
  if (!matched) return;

  function resolveStore() {
    var host = location.hostname.toLowerCase();
    var keys = Object.keys(STORE_MAP);
    for (var i = 0; i < keys.length; i++) {
      if (host.indexOf(keys[i]) > -1) return STORE_MAP[keys[i]];
    }
    return host;
  }

  var aiSource = matched
    .replace('chat.openai.com', 'chatgpt')
    .replace('.com', '').replace('.ai', '');

  fetch(SUPABASE_URL + '/rest/v1/geo_signals', {
    method: 'POST',
    headers: { 'apikey': ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ai_source:  aiSource,
      method:     matchAI(utmSrc) ? 'utm' : 'referrer',
      utm_source: utmSrc   || null,
      referrer:   referrer || null,
      page_url:   location.href,
      site:       resolveStore(),
      geo:        'hk'
    })
  }).catch(function () {});
})();

/* ============================================================
site-detail-bottom-hk.js (Shopline / HK geo)
역할: Product / BreadcrumbList / FAQPage / Organization 스키마 통합
방식: Shopline 네이티브 JSON-LD를 패치하고, 없으면 새로 생성
스토어: Foodology / OBGE / 95PROBLEM / EPAIS / FULLY — hostname 분기
플랫폼 주의: Shopline은 main-product.html에서 variant별 offers 배열을
  포함한 Product JSON-LD를 자체 렌더링함 (Shopify와 달리 기본 제공).
  breadcrumb 마크업도 Shopify와 클래스명이 달라 selector를 분리함
  (nav.breadcrumb, 상세는 snippets/breadcrumb.html 참고).
의존: 없음 (Vanilla JS)
============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
   * 스토어별 CONFIG 맵
   * key: location.hostname에 포함된 문자열
   * ────────────────────────────────────────────── */
  var STORE_CONFIGS = {
    'obge.hk': {
      storeName: 'OBGE',
      priceCurrency: 'HKD',
      shippingCountry: 'HK',
      freeShippingThresholdHkd: 399,
      flatShippingHkd: 40,
      flatShippingMacauHkd: 50,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '5F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'obge_cs@adapt.hk',
      orgPhone: '+82)10-9462-4615',
      orgInstagram: 'https://www.instagram.com/obge_hongkong/',
      merchantReturnDays: 14
    },
    '95problem.hk': {
      storeName: '95PROBLEM',
      priceCurrency: 'HKD',
      shippingCountry: 'HK',
      freeShippingThresholdHkd: 399,
      flatShippingHkd: 40,
      flatShippingMacauHkd: 50,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '5F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: '95problem_cs@adapt.hk',
      orgPhone: '+82)10-9462-4615',
      orgInstagram: 'https://www.instagram.com/95problem.hk.official/',
      merchantReturnDays: 14
    },
    'epais.hk': {
      storeName: 'EPAIS',
      priceCurrency: 'HKD',
      shippingCountry: 'HK',
      freeShippingThresholdHkd: 399,
      flatShippingHkd: 40,
      flatShippingMacauHkd: 50,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '5F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'epais_cs@adapt.hk',
      orgPhone: '+82)10-9462-4615',
      orgInstagram: 'https://www.instagram.com/epais.hongkong/',
      merchantReturnDays: 14
    },
    'fully.hk': {
      storeName: 'FULLY',
      priceCurrency: 'HKD',
      shippingCountry: 'HK',
      freeShippingThresholdHkd: 399,
      flatShippingHkd: 40,
      flatShippingMacauHkd: 50,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '5F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'fully_cs@fully.hk',
      orgPhone: '+82)10-9462-4615',
      orgInstagram: 'https://www.instagram.com/fully_hongkong/',
      merchantReturnDays: 14
    },
    'foodology.com.hk': {
      storeName: 'Foodology',
      priceCurrency: 'HKD',
      shippingCountry: 'HK',
      freeShippingThresholdHkd: 399,
      flatShippingHkd: 40,
      flatShippingMacauHkd: 50,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '5F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'foodology_cs@adapt.hk',
      orgPhone: '+82)10-9462-4615',
      orgInstagram: 'https://www.instagram.com/foodology.hongkong/',
      merchantReturnDays: 14
    }
  };

  /* ──────────────────────────────────────────────
   * hostname 기반 CONFIG 해석
   * ────────────────────────────────────────────── */
  function resolveConfig() {
    var host = (location.hostname || '').toLowerCase();
    var keys = Object.keys(STORE_CONFIGS);
    for (var i = 0; i < keys.length; i++) {
      if (host.indexOf(keys[i]) > -1) {
        return STORE_CONFIGS[keys[i]];
      }
    }
    // 매칭 실패 시 기본값(fallback) — 필요하면 수정
    return {
      storeName: '',
      priceCurrency: 'HKD',
      shippingCountry: 'HK',
      freeShippingThresholdHkd: 399,
      flatShippingHkd: 40,
      flatShippingMacauHkd: 50,
      orgAddress: { '@type': 'PostalAddress', addressCountry: 'HK' },
      orgEmail: '',
      orgPhone: '',
      orgInstagram: '',
      merchantReturnDays: 14
    };
  }

  var CONFIG = resolveConfig();

  /* ──────────────────────────────────────────────
   * 공통 유틸
   * ────────────────────────────────────────────── */
  var breadcrumbNavSelector = 'nav.breadcrumb';

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  function extractNumber(val) {
    var str = String(val || '').replace(/[^\d]/g, '');
    return str ? parseInt(str, 10) : null;
  }

  function extractPriceNumber(val) {
    var s = String(val || '').replace(/[^\d.]/g, '');
    if (!s) return null;
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function cleanText(text) {
    return String(text || '')
      .replace(/ /g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function nextYearDate() {
    var d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  }

  function typeIncludesProduct(t) {
    if (t === 'Product') return true;
    return Array.isArray(t) && t.indexOf('Product') > -1;
  }

  function typeIncludesTarget(t, target) {
    if (t === target) return true;
    return Array.isArray(t) && t.indexOf(target) > -1;
  }

  function safeJsonParse(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  /* ──────────────────────────────────────────────
   * DOM 기반 상품 데이터 추출 (Shopline: 폴백 용도)
   * Shopline 네이티브 JSON-LD가 이미 variant별 price/availability를
   * 포함하므로, 아래 함수들은 네이티브 스키마가 비어있을 때만 쓰인다.
   * ────────────────────────────────────────────── */
  function getSellingPriceFromDom() {
    var el = qs('.price-per-item--current, .price .money, [data-product-price]');
    if (!el) return null;
    return extractPriceNumber(el.textContent || el.getAttribute('content'));
  }

  function isProductSoldOut() {
    var btn = qs('button[name="add"], .product-form__submit, button[type="submit"][data-add-to-cart]');
    if (btn && btn.disabled) return true;
    if (qs('[data-available="false"], .product-form--sold-out')) return true;
    return false;
  }

  /* ──────────────────────────────────────────────
   * Offer 패치
   * ────────────────────────────────────────────── */
  function patchOffer(offer, canonUrl) {
    offer['@type'] = offer['@type'] || 'Offer';

    offer.url = offer.url || canonUrl;
    offer.priceCurrency = offer.priceCurrency || CONFIG.priceCurrency;
    offer.priceValidUntil = offer.priceValidUntil || nextYearDate();

    // http:// → https:// 정규화 (Shopline 네이티브 JSON-LD가 http://schema.org/ 를 사용함)
    if (offer.availability) {
      offer.availability = offer.availability.replace('http://schema.org/', 'https://schema.org/');
    }
    if (!offer.availability || offer.availability === 'InStock') {
      offer.availability = 'https://schema.org/InStock';
    }
    if (offer.availability === 'OutOfStock') {
      offer.availability = 'https://schema.org/OutOfStock';
    }

    offer.itemCondition = offer.itemCondition || 'https://schema.org/NewCondition';

    var priceNum = offer.price != null ? parseFloat(String(offer.price)) : NaN;
    var isFreeShipping = !isNaN(priceNum) && priceNum >= CONFIG.freeShippingThresholdHkd;

    if (!offer.shippingDetails) {
      // 香港地區運費 HKD40 / 澳門地區運費 HKD50 (滿 HKD399 免運費)
      offer.shippingDetails = [
        {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: isFreeShipping ? 0 : CONFIG.flatShippingHkd,
            currency: CONFIG.priceCurrency
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'HK'
          }
        },
        {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: isFreeShipping ? 0 : CONFIG.flatShippingMacauHkd,
            currency: CONFIG.priceCurrency
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'MO'
          }
        }
      ];
    }

    if (!offer.deliveryTime) {
      offer.deliveryTime = {
        '@type': 'ShippingDeliveryTime',
        handlingTime: {
          '@type': 'QuantitativeValue',
          minValue: 0,
          maxValue: 2,
          unitCode: 'DAY'
        },
        transitTime: {
          '@type': 'QuantitativeValue',
          minValue: 2,
          maxValue: 7,
          unitCode: 'DAY'
        }
      };
    }

    offer.hasMerchantReturnPolicy = {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: CONFIG.shippingCountry,
      returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
      merchantReturnDays: CONFIG.merchantReturnDays,
      returnMethod: 'https://schema.org/ReturnByMail',
      // 개인 사유 반품/교환 시 배송비 고객 부담
      returnFees: 'https://schema.org/ReturnShippingFees'
    };

    return offer;
  }

  /* ──────────────────────────────────────────────
   * Product 스키마 패치
   * ────────────────────────────────────────────── */
  function patchProductSchema(productObj) {
    var h1 = qs('h1');
    var titleText = h1 ? cleanText(h1.textContent) : '';
    var ogDesc = qs('meta[property="og:description"]');
    var metaDesc = qs('meta[name="description"]');
    var descText = cleanText(
      (ogDesc && ogDesc.getAttribute('content')) ||
      (metaDesc && metaDesc.getAttribute('content')) || ''
    );
    var linkCanon = qs('link[rel="canonical"]');
    var canonUrl = (linkCanon && linkCanon.getAttribute('href')) || location.origin + location.pathname + location.search;
    var isSoldOut = isProductSoldOut();
    var sellingPrice = getSellingPriceFromDom();

    if (!productObj.name && titleText) productObj.name = titleText;
    if (!cleanText(productObj.description) && descText) productObj.description = descText;
    if (!productObj.url) productObj.url = canonUrl;

    if (!productObj.sku) {
      var skuEl = qs('variant-sku, [data-variant-sku], .product__sku');
      var skuText = skuEl ? cleanText(skuEl.textContent || skuEl.getAttribute('data-sku') || '') : '';
      if (skuText) productObj.sku = skuText;
    }

    if (!productObj.image || (Array.isArray(productObj.image) && productObj.image.length === 0)) {
      var images = [];
      qsa('meta[property="og:image"]').forEach(function (m) {
        var content = m.getAttribute('content');
        if (content && images.indexOf(content) === -1) images.push(content);
      });
      if (images.length > 0) productObj.image = images;
    }

    if (!productObj.brand) {
      var siteMeta = qs('meta[property="og:site_name"]');
      var siteName = siteMeta && siteMeta.getAttribute('content');
      if (siteName) productObj.brand = { '@type': 'Brand', name: siteName };
    }

    if (!productObj.offers) productObj.offers = { '@type': 'Offer' };

    if (Array.isArray(productObj.offers)) {
      productObj.offers = productObj.offers.map(function (offer) {
        return patchOffer(offer, canonUrl);
      });
    } else {
      if ((!productObj.offers.price || productObj.offers.price === '') && sellingPrice !== null) {
        productObj.offers.price = String(sellingPrice);
      }
      if (!productObj.offers.availability) {
        productObj.offers.availability = isSoldOut ? 'OutOfStock' : 'InStock';
      }
      productObj.offers = patchOffer(productObj.offers, canonUrl);
    }

    if (!productObj.aggregateRating) {
      productObj.aggregateRating = extractAggregateRating();
    }

    return productObj;
  }

  /**
   * extractAggregateRating
   * 우선순위:
   *   1) 크리마 텍스트 — ".crema-product-reviews-score" 안의 "4.8 (393 reviews)" 패턴
   *   2) 마이크로데이터 itemprop
   */
  function extractAggregateRating() {
    var cremaSelectors = [
      '.crema-product-reviews-score',
      '.crema_product_reviews_score__container',
      '.crema-product-reviews-score-wrap'
    ];
    for (var ci = 0; ci < cremaSelectors.length; ci++) {
      var el = qs(cremaSelectors[ci]);
      if (!el) continue;
      var text = cleanText(el.textContent);
      var m = text.match(/([0-9]+(?:[.][0-9]+)?)\s*[(]\s*([0-9][0-9,]*)(?:\s*reviews?)?[)]/i);
      if (m) {
        var r = parseFloat(m[1]);
        var c = extractNumber(m[2]);
        if (!isNaN(r) && c !== null) {
          return { '@type': 'AggregateRating', ratingValue: String(r), reviewCount: String(c) };
        }
      }
      var rMatch = text.match(/^([0-9]+(?:[.][0-9]+)?)/);
      var cMatch = text.match(/([0-9][0-9,]*)\s*reviews?/i);
      if (rMatch && cMatch) {
        var rv = parseFloat(rMatch[1]);
        var cv = extractNumber(cMatch[1]);
        if (!isNaN(rv) && cv !== null) {
          return { '@type': 'AggregateRating', ratingValue: String(rv), reviewCount: String(cv) };
        }
      }
    }

    var ratingEl = qs('[itemprop="ratingValue"]');
    var reviewCntEl = qs('[itemprop="reviewCount"]');
    if (ratingEl && reviewCntEl) {
      var rVal = parseFloat(ratingEl.getAttribute('content') || ratingEl.textContent);
      var cVal = extractNumber(reviewCntEl.getAttribute('content') || reviewCntEl.textContent);
      if (!isNaN(rVal) && cVal !== null) {
        return { '@type': 'AggregateRating', ratingValue: String(rVal), reviewCount: String(cVal) };
      }
    }

    return null;
  }

  /* ──────────────────────────────────────────────
   * BreadcrumbList 스키마 생성
   * Shopline 마크업: nav.breadcrumb > a (home), a.breadcrumb__collection (중간)
   * ────────────────────────────────────────────── */
  function buildBreadcrumbSchema() {
    var items = [];
    var origin = location.origin;

    var navRoot = qs(breadcrumbNavSelector);
    var linkEls = navRoot ? qsa('a[href]', navRoot) : [];
    var firstCrumb = linkEls.length ? cleanText(linkEls[0].textContent).toLowerCase() : '';
    if (firstCrumb !== 'home') {
      items.push({ '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' });
    }

    var seen = {};
    linkEls.forEach(function (a) {
      var href = a.getAttribute('href');
      var name = cleanText(a.textContent);
      if (!href || !name || href === '#' || href === 'javascript:;' || seen[href + name]) return;
      seen[href + name] = true;
      if (href.indexOf('http') !== 0) {
        href = origin + (href.charAt(0) === '/' ? '' : '/') + href;
      }
      items.push({ '@type': 'ListItem', position: items.length + 1, name: name, item: href });
    });

    var lastH1 = qs('h1');
    var lastName = lastH1 ? cleanText(lastH1.textContent) : '';
    var canon = qs('link[rel="canonical"]');
    var lastUrl = (canon && canon.getAttribute('href')) || origin + location.pathname + location.search;
    if (!items.some(function (x) { return x.item === lastUrl; })) {
      items.push({ '@type': 'ListItem', position: items.length + 1, name: lastName, item: lastUrl });
    }

    return { '@type': 'BreadcrumbList', itemListElement: items };
  }

  /* ──────────────────────────────────────────────
   * FAQPage 스키마 생성
   * ────────────────────────────────────────────── */
  function buildFaqSchema(container) {
    var faqItems = [];

    // A) adtAccordionItem 구조 (구형)
    var dts = container.querySelectorAll('dt.adtAccordionItem');
    dts.forEach(function (dt) {
      var dd = dt.nextElementSibling;
      if (!dd || dd.tagName.toLowerCase() !== 'dd' || !dd.classList.contains('adtAccordionPanel')) return;
      var header = dt.querySelector('.adtAccordionHeader');
      var contentEl = dd.querySelector('.adt-accordion-content');
      var question = header ? cleanText(header.textContent) : '';
      var answer = contentEl ? cleanText(contentEl.textContent) : '';
      if (question && answer) {
        faqItems.push({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } });
      }
    });

    // B) accordion-disclosure / Shopline collapsible-content 구조
    //    Shopline: <div class="accordion"><details><summary><h3 class="accordion__title">...
    if (faqItems.length === 0) {
      var disclosures = container.querySelectorAll('accordion-disclosure, details.accordion__disclosure, .accordion details');
      disclosures.forEach(function (el) {
        var summary = el.querySelector('summary .text-with-icon, summary .accordion__title, summary span:first-child');
        var contentEl = el.querySelector('.accordion__content .prose, .accordion__content');
        var question = summary ? cleanText(summary.textContent) : '';
        var answer = contentEl ? cleanText(contentEl.textContent) : '';
        if (question && answer) {
          faqItems.push({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } });
        }
      });
    }

    if (faqItems.length === 0) return null;
    return { '@type': 'FAQPage', mainEntity: faqItems };
  }

  /* ──────────────────────────────────────────────
   * Organization 스키마 생성
   * ────────────────────────────────────────────── */
  function buildOrganizationSchema() {
    var origin = location.origin;
    var siteMeta = qs('meta[property="og:site_name"]');
    var siteName = cleanText((siteMeta && siteMeta.getAttribute('content')) || CONFIG.storeName || '');

    if (!siteName) return null;

    var org = {
      '@type': 'Organization',
      '@id': origin + '/#organization',
      name: siteName,
      url: origin
    };

    var ogImg = qs('meta[property="og:image"]');
    var logo = ogImg && ogImg.getAttribute('content');
    if (logo) org.logo = { '@type': 'ImageObject', url: logo };

    if (CONFIG.orgAddress && CONFIG.orgAddress.streetAddress) {
      org.address = CONFIG.orgAddress;
    }

    if (CONFIG.orgEmail) org.email = CONFIG.orgEmail;

    var phone = CONFIG.orgPhone || '';
    if (!phone) {
      var footer = qs('footer');
      var footerText = footer ? footer.textContent : '';
      var phoneEl = qs('.footer-phone, .cs-phone, [class*="phone"]');
      if (phoneEl && phoneEl.textContent) phone = cleanText(phoneEl.textContent);
      if (!phone) {
        var phoneMatch = footerText.match(/\+?[0-9][0-9\s\-()]{6,}/);
        if (phoneMatch) phone = cleanText(phoneMatch[0]);
      }
    }
    if (phone) {
      org.contactPoint = {
        '@type': 'ContactPoint',
        telephone: phone,
        contactType: 'Customer Service',
        areaServed: CONFIG.shippingCountry,
        availLanguage: 'English'
      };
    }

    var sameAs = CONFIG.orgInstagram ? [CONFIG.orgInstagram] : [];
    // CONFIG.orgInstagram이 신뢰 가능한 고정값이므로, DOM에서 긁은 인스타그램 링크는
    // (테마에 남아있는 옛 계정 등과 중복/충돌 방지를 위해) 제외하고 나머지 플랫폼만 보강한다.
    qsa('a[href*="youtube.com"], a[href*="facebook.com"], a[href*="tiktok.com"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && sameAs.indexOf(href) === -1) sameAs.push(href);
    });
    if (!CONFIG.orgInstagram) {
      qsa('a[href*="instagram.com"]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (href && sameAs.indexOf(href) === -1) sameAs.push(href);
      });
    }
    if (sameAs.length > 0) org.sameAs = sameAs;

    return org;
  }

  /* ──────────────────────────────────────────────
   * HowTo 스키마 생성
   * ────────────────────────────────────────────── */
  function buildHowToSchema() {
    var bodyText = (document.body && document.body.textContent) ? document.body.textContent : '';
    var lower = bodyText.toLowerCase();
    var keywordPairs = [
      { name: 'How to Use', key: 'how to use' },
      { name: 'How to Apply', key: 'how to apply' }
    ];

    for (var i = 0; i < keywordPairs.length; i++) {
      var idx = lower.indexOf(keywordPairs[i].key);
      if (idx === -1) continue;

      var slice = bodyText.slice(idx, idx + 4000).replace(/\s+/g, ' ');

      var stepByStep = [];
      var stepRe = /Step\s*(\d+)\s*([\s\S]*?)(?=Step\s*\d+|$)/gi;
      var m;
      while ((m = stepRe.exec(slice)) !== null) {
        var txt = cleanText(m[2]);
        if (txt) stepByStep.push({ '@type': 'HowToStep', text: txt });
      }
      if (stepByStep.length >= 2) {
        return { '@type': 'HowTo', name: keywordPairs[i].name, step: stepByStep };
      }

      var stepByNumber = [];
      var numRe = /(?:^|[^0-9])([1-9])[.)]s*([^]*?)(?=[^0-9][1-9][.)]|$)/g;
      var m2;
      while ((m2 = numRe.exec(slice)) !== null) {
        var stepNum = parseInt(m2[1], 10);
        if (stepNum === 1) stepByNumber = [];
        if (stepNum !== stepByNumber.length + 1) continue;
        var t = cleanText(m2[2]);
        if (!t || t.length < 3 || t.length > 300) continue;
        stepByNumber.push({ '@type': 'HowToStep', text: t });
      }
      if (stepByNumber.length >= 2) {
        return { '@type': 'HowTo', name: keywordPairs[i].name, step: stepByNumber };
      }
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * 성분 PropertyValue 생성 (어댑트 정보고시 위젯 공통)
   * ────────────────────────────────────────────── */
  function buildIngredientProperties() {
    var props = [];
    qsa('.adt-infotable .adt-infotable-row').forEach(function (row) {
      var labelEl = row.querySelector('.adt-infotable-label');
      var valueEl = row.querySelector('.adt-infotable-value');
      var label = labelEl ? cleanText(labelEl.textContent) : '';
      var value = valueEl ? cleanText(valueEl.textContent) : '';
      if (!label || !value) return;
      var targets = ['Ingredients', 'Ingredient', 'Net weight', 'Volume', 'Product name', '전성분', '원재료명', '기능성', '용량', '제품명'];
      var match = targets.some(function (t) { return label === t || label.indexOf(t) === 0; });
      if (!match) return;
      props.push({ '@type': 'PropertyValue', name: label, value: value });
    });
    return props;
  }

  /* ──────────────────────────────────────────────
   * ItemList 스키마 생성
   * ────────────────────────────────────────────── */
  function buildItemListSchema() {
    var items = [];
    var routineRoot = null;
    var headingCandidates = qsa('h1,h2,h3,h4,h5');
    for (var i = 0; i < headingCandidates.length; i++) {
      var t = headingCandidates[i].textContent || '';
      if (/build your complete/i.test(t) || /recommended products/i.test(t) || /routine/i.test(t) || /you might also like/i.test(t) || /related products/i.test(t)) {
        routineRoot = headingCandidates[i].parentNode || headingCandidates[i];
        break;
      }
    }

    var scope = routineRoot || document;
    var links = qsa('a[href*="/products/"]', scope);
    var seen = {};

    for (var j = 0; j < links.length; j++) {
      var a = links[j];
      var href = a.getAttribute('href') || '';
      if (!href || href === '#') continue;
      var absHref = href.indexOf('http') === 0 ? href : location.origin + (href.charAt(0) === '/' ? '' : '/') + href;
      if (seen[absHref]) continue;
      seen[absHref] = true;

      var imgEl = a.querySelector('img');
      var img = imgEl ? imgEl.getAttribute('src') || '' : '';
      if (img && img.indexOf('http') !== 0) img = img.indexOf('//') === 0 ? 'https:' + img : location.origin + img;

      var name = cleanText(a.textContent || '');
      if (!name) {
        var alt = imgEl ? imgEl.getAttribute('alt') : '';
        name = cleanText(alt || '');
      }
      if (!name || name.length > 120) continue;

      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        name: name,
        url: absHref || undefined,
        image: img || undefined
      });
      if (items.length >= 8) break;
    }

    if (items.length === 0) return null;
    return { '@type': 'ItemList', name: 'Recommended products', itemListElement: items };
  }

  function findProductNodeInGraph(graphObj) {
    if (!graphObj || !graphObj['@graph'] || !Array.isArray(graphObj['@graph'])) return null;
    for (var i = 0; i < graphObj['@graph'].length; i++) {
      var node = graphObj['@graph'][i];
      if (node && typeIncludesProduct(node['@type'])) return node;
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * Crema iframe 기반 Review / AggregateRating 보강
   * ────────────────────────────────────────────── */
  function extractJsonLdObjectsFromHtml(html) {
    if (!html) return [];
    var out = [];
    var re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    var m;
    while ((m = re.exec(html)) !== null) {
      var raw = (m[1] || '').trim();
      if (!raw) continue;
      var obj = safeJsonParse(raw);
      if (obj) out.push(obj);
    }
    return out;
  }

  function collectNodesByType(root, targetType, limit) {
    var out = [];
    function walk(node) {
      if (!node || out.length >= (limit || 10)) return;
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) { if (out.length >= (limit || 10)) return; walk(node[i]); }
        return;
      }
      if (typeof node !== 'object') return;
      if (typeIncludesTarget(node['@type'], targetType)) { out.push(node); return; }
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        walk(node[k]);
        if (out.length >= (limit || 10)) return;
      }
    }
    walk(root);
    return out;
  }

  function collectFirstAggregateRating(root) {
    var ar = null;
    function walk(node) {
      if (!node || ar) return;
      if (Array.isArray(node)) {
        for (var i = 0; i < node.length; i++) { if (ar) return; walk(node[i]); }
        return;
      }
      if (typeof node !== 'object') return;
      if (typeIncludesTarget(node['@type'], 'AggregateRating')) { ar = node; return; }
      for (var k in node) {
        if (!Object.prototype.hasOwnProperty.call(node, k)) continue;
        walk(node[k]);
        if (ar) return;
      }
    }
    walk(root);
    return ar;
  }

  function maybeEnhanceFromCremaIframe(parsedJsonLd, productNode, targetScriptNode) {
    if (!parsedJsonLd) return;
    productNode = productNode || findProductNodeInGraph(parsedJsonLd);
    if (!productNode) return;

    var needAgg = !productNode.aggregateRating;
    var needReview = !productNode.review || (Array.isArray(productNode.review) && productNode.review.length === 0);
    if (!needAgg && !needReview) return;

    var iframe = qs('iframe[id^="crema-product-reviews"]');
    if (!iframe) return;
    var src = iframe.getAttribute('src') || iframe.src;
    if (!src) return;

    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 7000) : null;

    fetch(src, { method: 'GET', credentials: 'include', mode: 'cors', signal: controller ? controller.signal : undefined })
      .then(function (res) { return res.text(); })
      .then(function (html) {
        if (timer) clearTimeout(timer);
        var ldObjs = extractJsonLdObjectsFromHtml(html);
        if (!ldObjs.length) return;

        if (needAgg) {
          for (var i = 0; i < ldObjs.length; i++) {
            var ar = collectFirstAggregateRating(ldObjs[i]);
            if (ar && ar.ratingValue && ar.reviewCount) {
              productNode.aggregateRating = {
                '@type': 'AggregateRating',
                ratingValue: String(ar.ratingValue),
                reviewCount: String(ar.reviewCount)
              };
              break;
            }
          }
        }

        if (needReview) {
          var reviews = [];
          for (var j = 0; j < ldObjs.length; j++) {
            var rs = collectNodesByType(ldObjs[j], 'Review', 5);
            if (rs && rs.length) reviews = reviews.concat(rs);
            if (reviews.length >= 3) break;
          }
          var filtered = reviews.filter(function (r) {
            return r && (r.reviewBody || r.reviewBody === '' || r.reviewRating);
          });
          if (filtered.length) productNode.review = filtered.slice(0, 3);
        }

        if (targetScriptNode) {
          targetScriptNode.textContent = JSON.stringify(parsedJsonLd);
        } else {
          var slot = document.getElementById('pd-schema-product');
          if (slot) slot.textContent = JSON.stringify(parsedJsonLd);
        }
      })
      .catch(function () {
        if (timer) clearTimeout(timer);
      });
  }

  /* ──────────────────────────────────────────────
   * 기존 JSON-LD에서 Product 노드만 추출 (제거 전)
   * ────────────────────────────────────────────── */
  function extractProductObj() {
    var scripts = qsa('script[type="application/ld+json"]');
    for (var s = 0; s < scripts.length; s++) {
      try {
        var json = JSON.parse(scripts[s].textContent);
        if (typeIncludesProduct(json['@type'])) return json;
        if (json['@graph'] && Array.isArray(json['@graph'])) {
          for (var k = 0; k < json['@graph'].length; k++) {
            if (json['@graph'][k] && typeIncludesProduct(json['@graph'][k]['@type'])) {
              return json['@graph'][k];
            }
          }
        }
      } catch (e) {}
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * 페이지 내 모든 JSON-LD <script> 태그 제거
   * ────────────────────────────────────────────── */
  function removeAllJsonLdScripts() {
    qsa('script[type="application/ld+json"]').forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  /* ──────────────────────────────────────────────
   * 메인 실행 — 단일 @graph 통합
   * ────────────────────────────────────────────── */
  function init() {
    // 1) 기존 Product 객체 추출 (Shopline 네이티브 JSON-LD, 태그 제거 전)
    var rawProduct = extractProductObj();

    // 2) FAQ 컨테이너 탐색 — adtFaqContainer(구형) 또는 .faq/.accordion 섹션(Shopline)
    var faqSchema = null;
    var faqContainer = (function () {
      var c = qs('.faqSection') || qs('.adtFaqContainer');
      if (c) return c;
      var faqSections = qsa('section[id*="faq"], div[id*="faq"]');
      var best = null;
      var bestCount = 0;
      faqSections.forEach(function (sec) {
        var hasHeading = !!sec.querySelector('h2, h3');
        var count = sec.querySelectorAll('.accordion details, accordion-disclosure, dt.adtAccordionItem').length;
        if (hasHeading && count > bestCount) { best = sec; bestCount = count; }
      });
      if (best) return best;
      var faqDivs = qsa('.faq');
      var bestDiv = null;
      var bestDivCount = 0;
      faqDivs.forEach(function (d) {
        var count = d.querySelectorAll('.accordion details, accordion-disclosure, dt.adtAccordionItem').length;
        if (count > bestDivCount) { bestDiv = d; bestDivCount = count; }
      });
      return bestDiv;
    }());
    var commonInfo = document.getElementById('common_info');
    if (faqContainer && commonInfo && commonInfo.parentNode) {
      commonInfo.parentNode.insertBefore(faqContainer, commonInfo.nextSibling);
    }
    if (faqContainer) faqSchema = buildFaqSchema(faqContainer);

    // 3) 각 스키마 빌드
    var productObj       = patchProductSchema(rawProduct || { '@context': 'https://schema.org', '@type': 'Product' });
    var orgSchema        = buildOrganizationSchema();
    var breadcrumbSchema = buildBreadcrumbSchema();
    var itemListSchema   = buildItemListSchema();
    var howToSchema      = buildHowToSchema();

    // 4) Organization → brand / manufacturer 연결
    if (orgSchema) {
      if (productObj.brand) {
        productObj.brand['@id'] = orgSchema['@id'];
      } else {
        productObj.brand = { '@type': 'Brand', '@id': orgSchema['@id'], name: orgSchema.name };
      }
      productObj.manufacturer = { '@type': 'Organization', '@id': orgSchema['@id'] };
    }

    // 5) 성분 PropertyValue
    var ingredientProps = buildIngredientProperties();
    if (ingredientProps.length > 0) productObj.additionalProperty = ingredientProps;

    // 6) 단일 @graph 조립
    var graph = [];
    if (orgSchema)        graph.push(orgSchema);
    graph.push(productObj);
    if (breadcrumbSchema) graph.push(breadcrumbSchema);
    if (faqSchema)        graph.push(faqSchema);
    if (itemListSchema)   graph.push(itemListSchema);
    if (howToSchema)      graph.push(howToSchema);

    var finalSchema = { '@context': 'https://schema.org', '@graph': graph };

    // 7) 기존 JSON-LD 태그 전부 제거
    removeAllJsonLdScripts();

    // 8) 단일 <script> 태그로 주입
    var sc = document.createElement('script');
    sc.type = 'application/ld+json';
    sc.id = 'pd-schema-unified';
    sc.textContent = JSON.stringify(finalSchema);
    document.head.appendChild(sc);

    // 9) Crema iframe 기반 Review / AggregateRating 보강 (비동기)
    maybeEnhanceFromCremaIframe(finalSchema, productObj, sc);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
