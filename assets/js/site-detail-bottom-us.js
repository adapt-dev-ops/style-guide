/* ============================================================
site-detail-bottom-us.js (Shopify / US geo)
역할: Product / BreadcrumbList / FAQPage / Organization 스키마 통합
방식: Shopify 기본 JSON-LD를 패치하고, 없으면 새로 생성
스토어: Foodology / OBGE / EPAIS / FULLY — hostname 분기
의존: 없음 (Vanilla JS)
============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────
   * 스토어별 CONFIG 맵
   * key: location.hostname에 포함된 문자열
   * ────────────────────────────────────────────── */
  var STORE_CONFIGS = {
    'foodology-global.com': {
      storeName: 'Foodology',
      priceCurrency: 'USD',
      shippingCountry: 'US',
      freeShippingThresholdUsd: 59,
      flatShippingUsd: 5.99,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '4F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'cs@foodology-us.com',
      orgPhone: '+82-1660-1910',
      orgInstagram: 'https://www.instagram.com/foodology.global/',
      /*
       * 캐나다 배송 정책 (참고용 — 별도 Shopify Markets 설정으로 관리)
       * $0–$99.99: $20 / $100–$199.99: $26 / $200–$299.99: $33 / $300+: Free (DDP via UPS)
       */
      merchantReturnDays: 30
    },
    'obgeglobal.com': {
      storeName: 'OBGE',
      priceCurrency: 'USD',
      shippingCountry: 'US',
      freeShippingThresholdUsd: 60,
      flatShippingUsd: 6.99,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '4F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'valued@obge-us.com',
      orgPhone: '+82-1660-1910',
      orgInstagram: 'https://www.instagram.com/obge_global/',
      /*
       * 특수 지역 배송 (참고용 — Shopify Shipping Zones로 관리)
       * HI / AK / PR / VI: $16.50 flat (cart total 무관)
       */
      merchantReturnDays: 30
    },
    'epais-global.com': {
      storeName: 'EPAIS',
      priceCurrency: 'USD',
      shippingCountry: 'US',
      freeShippingThresholdUsd: 60,
      flatShippingUsd: 6.99,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '4F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'cs@epais-global.com',
      orgPhone: '+82-1660-1910',
      orgInstagram: 'https://www.instagram.com/epais.global/',
      /*
       * 특수 지역 배송 (참고용 — Shopify Shipping Zones로 관리)
       * HI / AK / PR / VI: $16.50 flat (cart total 무관)
       */
      merchantReturnDays: 30
    },
    'thefullyglobal.com': {
      storeName: 'FULLY',
      priceCurrency: 'USD',
      shippingCountry: 'US',
      freeShippingThresholdUsd: 60,
      flatShippingUsd: 6.99,
      orgAddress: {
        '@type': 'PostalAddress',
        streetAddress: '4F, 534 Samseong-ro',
        addressLocality: 'Gangnam-gu',
        addressRegion: 'Seoul',
        postalCode: '',
        addressCountry: 'KR'
      },
      orgEmail: 'contact@fully-cosmetic.com',
      orgPhone: '+82-1660-1910',
      orgInstagram: 'https://www.instagram.com/fully_global/',
      /*
       * 특수 지역 배송 (참고용 — Shopify Shipping Zones로 관리)
       * HI / AK / PR / VI: $16.50 flat (cart total 무관)
       */
      merchantReturnDays: 30
    }
  };

  /* ──────────────────────────────────────────────
   * hostname 기반 CONFIG 해석
   * 커스텀 도메인 / myshopify 서브도메인 모두 대응
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
      priceCurrency: 'USD',
      shippingCountry: 'US',
      freeShippingThresholdUsd: 60,
      flatShippingUsd: 6.99,
      orgAddress: { '@type': 'PostalAddress', addressCountry: 'US' },
      orgEmail: '',
      orgPhone: '',
      orgInstagram: '',
      merchantReturnDays: 30
    };
  }

  var CONFIG = resolveConfig();

  /* ──────────────────────────────────────────────
   * 공통 유틸
   * ────────────────────────────────────────────── */
  var breadcrumbNavSelector = 'nav.breadcrumb_collection';

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
      .replace(/\u00a0/g, ' ')
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
   * DOM 기반 상품 데이터 추출
   * ────────────────────────────────────────────── */
  function getShopifyProductFromDom() {
    var nodes = qsa('script[type="application/json"][id^="ProductJson"], script[type="application/json"][id*="product-json"]');
    for (var i = 0; i < nodes.length; i++) {
      try { return JSON.parse(nodes[i].textContent); } catch (e) {}
    }
    return null;
  }

  function getSellingPriceFromDom() {
    var p = getShopifyProductFromDom();
    if (p && p.selected_or_first_available_variant) {
      var cents = p.selected_or_first_available_variant.price;
      if (typeof cents === 'number') return cents / 100;
    }
    var el = qs('.price .money, .price-item--sale .money, [data-product-price], .product__price .money');
    if (!el) return null;
    return extractPriceNumber(el.textContent || el.getAttribute('content'));
  }

  function isProductSoldOut() {
    var btn = qs('button[name="add"], .product-form__submit, button[type="submit"][data-add-to-cart]');
    if (btn && btn.disabled) return true;
    if (qs('[data-available="false"], .product-form--sold-out')) return true;
    var prod = getShopifyProductFromDom();
    if (prod && prod.selected_or_first_available_variant && prod.selected_or_first_available_variant.available === false) {
      return true;
    }
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

    if (!offer.availability || offer.availability === 'InStock') {
      offer.availability = 'https://schema.org/InStock';
    }
    if (offer.availability === 'OutOfStock') {
      offer.availability = 'https://schema.org/OutOfStock';
    }

    offer.itemCondition = offer.itemCondition || 'https://schema.org/NewCondition';

    var priceNum = offer.price != null ? parseFloat(String(offer.price)) : NaN;
    var isFreeShipping = !isNaN(priceNum) && priceNum >= CONFIG.freeShippingThresholdUsd;
    var shippingValue = isFreeShipping ? 0 : CONFIG.flatShippingUsd;

    if (!offer.shippingDetails) {
      offer.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: shippingValue,
          currency: CONFIG.priceCurrency
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: CONFIG.shippingCountry
        }
      };
    } else if (offer.shippingDetails.shippingRate) {
      offer.shippingDetails.shippingRate.value = shippingValue;
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
      returnFees: 'https://schema.org/FreeReturn'
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
    var shopifyProduct = getShopifyProductFromDom();

    if (!productObj.name && titleText) productObj.name = titleText;
    if (!productObj.description && descText) productObj.description = descText;
    if (!productObj.url) productObj.url = canonUrl;

    if (!productObj.sku && shopifyProduct && shopifyProduct.selected_or_first_available_variant) {
      var sku = shopifyProduct.selected_or_first_available_variant.sku;
      if (sku) productObj.sku = sku;
    }
    if (!productObj.sku) {
      var skuEl = qs('variant-sku, [data-variant-sku], .product__sku');
      var skuText = skuEl ? cleanText(skuEl.textContent || skuEl.getAttribute('data-sku') || '') : '';
      if (skuText) productObj.sku = skuText;
    }

    if (!productObj.image || productObj.image.length === 0) {
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
      var cremaWrap = qs('.crema-product-reviews-score-wrap');
      if (cremaWrap) {
        var divEl = cremaWrap.querySelector('div');
        var aEl = cremaWrap.querySelector('a');
        var scoreVal = divEl ? parseFloat(divEl.textContent) : NaN;
        var reviewCnt = aEl ? extractNumber(aEl.textContent) : null;
        if (!isNaN(scoreVal) && reviewCnt !== null) {
          productObj.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: String(scoreVal),
            reviewCount: String(reviewCnt)
          };
        }
      }
      if (!productObj.aggregateRating) {
        var fallback = getAggregateRatingFromDomFallback();
        if (fallback) productObj.aggregateRating = fallback;
      }
    }

    return productObj;
  }

  function getAggregateRatingFromDomFallback() {
    // 1) 마이크로데이터
    var ratingEl = qs('[itemprop="ratingValue"]');
    var reviewCntEl = qs('[itemprop="reviewCount"]');
    if (ratingEl && reviewCntEl) {
      var rVal = parseFloat(ratingEl.getAttribute('content') || ratingEl.textContent);
      var cVal = extractNumber(reviewCntEl.getAttribute('content') || reviewCntEl.textContent);
      if (!isNaN(rVal) && cVal !== null) {
        return { '@type': 'AggregateRating', ratingValue: String(rVal), reviewCount: String(cVal) };
      }
    }

    // 2) aria-label 기반 — "4.0 out of 5.0 stars" 형태 포함 대응
    var candidates = qsa('[aria-label*="out of 5"], [aria-label*="stars"], [aria-label*="reviews"]');
    for (var i = 0; i < candidates.length; i++) {
      var label = candidates[i].getAttribute('aria-label') || '';
      if (!label) continue;

      // "4.0 out of 5.0 stars" / "4.0 out of 5 stars" 모두 매칭
      var ratingMatch = label.match(/([0-9]+(?:\.[0-9]+)?)\s*out\s*of\s*5(?:\.[0-9]+)?\s*stars/i);
      if (!ratingMatch) continue;

      var r = parseFloat(ratingMatch[1]);
      if (isNaN(r)) continue;

      // reviewCount: 같은 aria-label 안에 있는 경우
      var reviewMatch = label.match(/(?:based on|reviews?)\s*([0-9][0-9,]*)/i) || label.match(/([0-9][0-9,]*)\s*reviews?/i);
      var c = reviewMatch ? extractNumber(reviewMatch[1]) : null;

      // reviewCount: 인접 형제 / 부모 근처 요소에서 탐색
      if (c === null) {
        var parent = candidates[i].parentElement;
        // 부모 및 형제 요소에서 "N reviews" / "(N)" 패턴 탐색 (최대 3단계 상위)
        for (var up = 0; up < 3 && parent; up++) {
          var siblings = qsa('[class*="count"], [class*="review"], [class*="rating"]', parent);
          for (var si = 0; si < siblings.length; si++) {
            var siText = cleanText(siblings[si].textContent);
            var siMatch = siText.match(/([0-9][0-9,]*)/);
            if (siMatch) { c = extractNumber(siMatch[1]); break; }
          }
          if (c !== null) break;
          // 부모 텍스트 전체에서도 시도
          var parentText = cleanText(parent.textContent);
          var parentMatch = parentText.match(/([0-9][0-9,]*)\s*reviews?/i) || parentText.match(/\(([0-9][0-9,]*)\)/);
          if (parentMatch) { c = extractNumber(parentMatch[1]); break; }
          parent = parent.parentElement;
        }
      }

      if (c !== null) {
        return { '@type': 'AggregateRating', ratingValue: String(r), reviewCount: String(c) };
      }
      // reviewCount를 끝내 못 찾으면 rating만이라도 기록
      return { '@type': 'AggregateRating', ratingValue: String(r), reviewCount: '0' };
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * BreadcrumbList 스키마 생성
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
      if (!href || !name || href === '#' || seen[href + name]) return;
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
    var dts = container.querySelectorAll('dt.adtAccordionItem');

    dts.forEach(function (dt) {
      var dd = dt.nextElementSibling;
      if (!dd || dd.tagName.toLowerCase() !== 'dd' || !dd.classList.contains('adtAccordionPanel')) return;
      var header = dt.querySelector('.adtAccordionHeader');
      var contentEl = dd.querySelector('.adt-accordion-content');
      var question = header ? cleanText(header.textContent) : '';
      var answer = contentEl ? cleanText(contentEl.textContent) : '';
      if (question && answer) {
        faqItems.push({
          '@type': 'Question',
          name: question,
          acceptedAnswer: { '@type': 'Answer', text: answer }
        });
      }
    });

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

    // CONFIG 고정값 우선, DOM 수집로 보완
    var sameAs = CONFIG.orgInstagram ? [CONFIG.orgInstagram] : [];
    qsa('a[href*="instagram.com"], a[href*="youtube.com"], a[href*="facebook.com"], a[href*="tiktok.com"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && sameAs.indexOf(href) === -1) sameAs.push(href);
    });
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

      // 해당 섹션 근처 텍스트 추출 후 공백 정규화
      var slice = bodyText.slice(idx, idx + 4000).replace(/\s+/g, ' ');

      // "Step 1 ... Step 2 ..." 패턴
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

      // "1. ... 2. ... 3. ..." 숫자 목록 패턴
      var stepByNumber = [];
      var numRe = /(?:^|\s)(\d+)\.\s*([\s\S]*?)(?=\s+\d+\.|$)/g;
      var m2;
      while ((m2 = numRe.exec(slice)) !== null) {
        var t = cleanText(m2[2]);
        if (t && t.length > 2 && t.length < 400) {
          stepByNumber.push({ '@type': 'HowToStep', text: t });
        }
      }
      if (stepByNumber.length >= 2) {
        return { '@type': 'HowTo', name: keywordPairs[i].name, step: stepByNumber };
      }
    }
    return null;
  }

  /* ──────────────────────────────────────────────
   * 성분 PropertyValue 생성
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

  /* ──────────────────────────────────────────────
   * @graph 병합
   * ────────────────────────────────────────────── */
  function mergeIntoGraph(productObj, breadcrumbSchema, faqSchema, orgSchema, itemListSchema, howToSchema) {
    var graph = [];

    if (orgSchema) {
      graph.push(orgSchema);
      if (productObj.brand) productObj.brand['@id'] = orgSchema['@id'];
      productObj.manufacturer = { '@type': 'Organization', '@id': orgSchema['@id'] };
    }

    var ingredientProps = buildIngredientProperties();
    if (ingredientProps.length > 0) productObj.additionalProperty = ingredientProps;

    graph.push(productObj);
    if (breadcrumbSchema) graph.push(breadcrumbSchema);
    if (faqSchema) graph.push(faqSchema);
    if (itemListSchema) graph.push(itemListSchema);
    if (howToSchema) graph.push(howToSchema);

    return { '@context': 'https://schema.org', '@graph': graph };
  }

  /* ──────────────────────────────────────────────
   * 기존 JSON-LD에서 Product 노드 탐색
   * ────────────────────────────────────────────── */
  function findProductJsonLd() {
    var targetScriptNode = null;
    var parsedJsonLd = null;
    var graphIndex = -1;

    var scripts = qsa('script[type="application/ld+json"]');
    for (var s = 0; s < scripts.length; s++) {
      var node = scripts[s];
      try {
        var json = JSON.parse(node.textContent);
        if (typeIncludesProduct(json['@type'])) {
          targetScriptNode = node;
          parsedJsonLd = json;
          break;
        }
        if (json['@graph'] && Array.isArray(json['@graph'])) {
          for (var k = 0; k < json['@graph'].length; k++) {
            var item = json['@graph'][k];
            if (item && typeIncludesProduct(item['@type'])) {
              targetScriptNode = node;
              parsedJsonLd = json;
              graphIndex = k;
              break;
            }
          }
          if (targetScriptNode) break;
        }
      } catch (e) {}
    }

    return { targetScriptNode: targetScriptNode, parsedJsonLd: parsedJsonLd, graphIndex: graphIndex };
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
   * 메인 실행
   * ────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var found = findProductJsonLd();
    var targetScriptNode = found.targetScriptNode;
    var parsedJsonLd = found.parsedJsonLd;
    var graphIndex = found.graphIndex;

    var breadcrumbSchema = buildBreadcrumbSchema();
    var orgSchema = buildOrganizationSchema();
    var itemListSchema = buildItemListSchema();
    var howToSchema = buildHowToSchema();
    var faqSchema = null;
    var faqContainer = qs('.adtFaqContainer');
    var commonInfo = document.getElementById('common_info');

    if (faqContainer && commonInfo && commonInfo.parentNode) {
      commonInfo.parentNode.insertBefore(faqContainer, commonInfo.nextSibling);
      faqSchema = buildFaqSchema(faqContainer);
    } else if (faqContainer) {
      faqSchema = buildFaqSchema(faqContainer);
    }

    if (parsedJsonLd) {
      if (graphIndex > -1) {
        parsedJsonLd['@graph'][graphIndex] = patchProductSchema(parsedJsonLd['@graph'][graphIndex]);

        if (orgSchema) {
          var hasOrg = parsedJsonLd['@graph'].some(function (g) { return g['@type'] === 'Organization'; });
          if (!hasOrg) parsedJsonLd['@graph'].unshift(orgSchema);
        }

        if (breadcrumbSchema) {
          var hasBreadcrumb = parsedJsonLd['@graph'].some(function (g) { return g['@type'] === 'BreadcrumbList'; });
          if (!hasBreadcrumb) parsedJsonLd['@graph'].push(breadcrumbSchema);
        }

        if (faqSchema) parsedJsonLd['@graph'].push(faqSchema);
        if (itemListSchema) parsedJsonLd['@graph'].push(itemListSchema);
        if (howToSchema) parsedJsonLd['@graph'].push(howToSchema);

        var ingredientProps = buildIngredientProperties();
        if (ingredientProps.length > 0) {
          parsedJsonLd['@graph'][graphIndex].additionalProperty = ingredientProps;
        }

        if (orgSchema) {
          var prod = parsedJsonLd['@graph'][graphIndex];
          if (prod.brand) {
            prod.brand['@id'] = orgSchema['@id'];
          } else {
            prod.brand = { '@type': 'Brand', '@id': orgSchema['@id'], name: orgSchema.name };
          }
          prod.manufacturer = { '@type': 'Organization', '@id': orgSchema['@id'] };
        }
      } else {
        parsedJsonLd = mergeIntoGraph(
          patchProductSchema(parsedJsonLd),
          breadcrumbSchema, faqSchema, orgSchema, itemListSchema, howToSchema
        );
      }

      if (targetScriptNode) {
        targetScriptNode.textContent = JSON.stringify(parsedJsonLd);
      }

      var slot = document.getElementById('pd-schema-product');
      var slotText = slot ? cleanText(slot.textContent) : '';
      if (slot && (!slotText || slotText === '{}' || slotText === '{"@context":"https://schema.org"}')) {
        slot.remove();
      }
    } else {
      var newSchema = mergeIntoGraph(
        patchProductSchema({ '@context': 'https://schema.org', '@type': 'Product' }),
        breadcrumbSchema, faqSchema, orgSchema, itemListSchema, howToSchema
      );

      var existingSlot = document.getElementById('pd-schema-product');
      if (existingSlot) {
        existingSlot.textContent = JSON.stringify(newSchema);
      } else {
        var sc = document.createElement('script');
        sc.type = 'application/ld+json';
        sc.id = 'pd-schema-product';
        sc.textContent = JSON.stringify(newSchema);
        document.head.appendChild(sc);
      }

      maybeEnhanceFromCremaIframe(newSchema, findProductNodeInGraph(newSchema), null);
    }

    if (parsedJsonLd) {
      var productNode = graphIndex > -1
        ? parsedJsonLd['@graph'][graphIndex]
        : findProductNodeInGraph(parsedJsonLd);
      maybeEnhanceFromCremaIframe(parsedJsonLd, productNode, targetScriptNode);
    }
  });

})();