/* ============================================================
schema-patch-us.js (Shopify / US geo)
역할: Product / BreadcrumbList / FAQPage / Organization 스키마 통합
방식: Shopify 기본 JSON-LD를 패치하고, 없으면 새로 생성
의존: 없음 (Vanilla JS)
============================================================ */

(function () {
  'use strict';

  var CONFIG = {
    priceCurrency: 'USD',
    shippingCountry: 'US',
    /** 무료배송 기준(USD) — 스토어 정책에 맞게 수정 */
    freeShippingThresholdUsd: 50,
    /** 무료 미만 시 평균 배송비(USD) — 스토어 정책에 맞게 수정 */
    flatShippingUsd: 5.99,
    /** Organization 고정 주소 — 실제 사업자 주소로 교체 */
    orgAddress: {
      '@type': 'PostalAddress',
      streetAddress: '',
      addressLocality: '',
      addressRegion: '',
      postalCode: '',
      addressCountry: 'US'
    },
    orgEmail: '',
    /**
     * 브레드크럼 JSON-LD용 — Liquid의 숨김 네비와 동일 선택자
     * 첫 번째 링크 텍스트는 "Home" 권장 (중복 Home 삽입 방지)
     * 예: <nav class="breadcrumb_collection" ...><ol><li><a href="{{ routes.root_url }}">Home</a></li>...
     */
    breadcrumbNavSelector: 'nav.breadcrumb_collection'
  };

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

  /** 가격 문자열에서 소수 포함 숫자 추출 (USD) */
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

  function getShopifyProductFromDom() {
    var nodes = qsa('script[type="application/json"][id^="ProductJson"], script[type="application/json"][id*="product-json"]');
    for (var i = 0; i < nodes.length; i++) {
      try {
        return JSON.parse(nodes[i].textContent);
      } catch (e) {}
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
    if (!el) return extractPriceNumber(null);
    var t = el.textContent || el.getAttribute('content');
    return extractPriceNumber(t);
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
      merchantReturnDays: 30,
      returnMethod: 'https://schema.org/ReturnByMail',
      returnFees: 'https://schema.org/FreeReturn'
    };

    return offer;
  }

  function patchProductSchema(productObj) {
    var h1 = qs('h1');
    var titleText = h1 ? cleanText(h1.textContent) : '';
    var ogDesc = qs('meta[property="og:description"]');
    var metaDesc = qs('meta[name="description"]');
    var descText = cleanText((ogDesc && ogDesc.getAttribute('content')) || (metaDesc && metaDesc.getAttribute('content')) || '');
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

    var cremaWrap = qs('.crema-product-reviews-score-wrap');
    if (cremaWrap && !productObj.aggregateRating) {
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

    return productObj;
  }

  function buildBreadcrumbSchema() {
    var items = [];
    var origin = location.origin;

    var navRoot = qs(CONFIG.breadcrumbNavSelector);
    var linkEls = navRoot ? qsa('a[href]', navRoot) : [];
    var firstCrumb = linkEls.length ? cleanText(linkEls[0].textContent).toLowerCase() : '';
    if (firstCrumb !== 'home') {
      items.push({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: origin + '/'
      });
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
      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        name: name,
        item: href
      });
    });

    var lastH1 = qs('h1');
    var lastName = lastH1 ? cleanText(lastH1.textContent) : '';
    var canon = qs('link[rel="canonical"]');
    var lastUrl = (canon && canon.getAttribute('href')) || origin + location.pathname + location.search;
    if (!items.some(function (x) { return x.item === lastUrl; })) {
      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        name: lastName,
        item: lastUrl
      });
    }

    return { '@type': 'BreadcrumbList', itemListElement: items };
  }

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

  function buildOrganizationSchema() {
    var origin = location.origin;
    var siteMeta = qs('meta[property="og:site_name"]');
    var siteName = cleanText((siteMeta && siteMeta.getAttribute('content')) || '');

    if (!siteName) return null;

    var org = {
      '@type': 'Organization',
      '@id': origin + '/#organization',
      name: siteName,
      url: origin
    };

    var ogImg = qs('meta[property="og:image"]');
    var logo = ogImg && ogImg.getAttribute('content');
    if (logo) {
      org.logo = { '@type': 'ImageObject', url: logo };
    }

    if (CONFIG.orgAddress.streetAddress) {
      org.address = CONFIG.orgAddress;
    }

    if (CONFIG.orgEmail) {
      org.email = CONFIG.orgEmail;
    }

    var phoneEl = qs('.footer-phone, .cs-phone, [class*="phone"]');
    var phone = phoneEl ? cleanText(phoneEl.textContent) : '';
    if (phone) {
      org.contactPoint = {
        '@type': 'ContactPoint',
        telephone: phone,
        contactType: 'Customer Service',
        areaServed: CONFIG.shippingCountry,
        availLanguage: 'English'
      };
    }

    var sameAs = [];
    qsa('a[href*="instagram.com"], a[href*="youtube.com"], a[href*="facebook.com"], a[href*="tiktok.com"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && sameAs.indexOf(href) === -1) sameAs.push(href);
    });
    if (sameAs.length > 0) org.sameAs = sameAs;

    return org;
  }

  function buildIngredientProperties() {
    var props = [];

    qsa('.adt-infotable .adt-infotable-row').forEach(function (row) {
      var labelEl = row.querySelector('.adt-infotable-label');
      var valueEl = row.querySelector('.adt-infotable-value');
      var label = labelEl ? cleanText(labelEl.textContent) : '';
      var value = valueEl ? cleanText(valueEl.textContent) : '';

      if (!label || !value) return;

      var targets = ['Ingredients', 'Ingredient', 'Net weight', 'Volume', 'Product name', '전성분', '원재료명', '기능성', '용량', '제품명'];
      var match = targets.some(function (t) {
        return label === t || label.indexOf(t) === 0;
      });
      if (!match) return;

      props.push({
        '@type': 'PropertyValue',
        name: label,
        value: value
      });
    });

    return props;
  }

  function buildItemListSchema() {
    var items = [];
    var slides = qsa(
      '#prd_recommend .swiper-slide, .product-recommendations .grid__item, [data-product-recommendations] .card'
    );

    slides.forEach(function (slide) {
      var titleEl = slide.querySelector('h3, .card__heading, .product-card__title');
      var name = titleEl ? cleanText(titleEl.textContent) : '';
      var link = slide.querySelector('a');
      var href = link ? link.getAttribute('href') || '' : '';
      var imgEl = slide.querySelector('img');
      var img = imgEl ? imgEl.getAttribute('src') || '' : '';

      if (!name) return;

      if (href && href.indexOf('http') !== 0) {
        href = location.origin + (href.charAt(0) === '/' ? '' : '/') + href;
      }
      if (img && img.indexOf('http') !== 0) {
        img = 'https:' + img;
      }

      items.push({
        '@type': 'ListItem',
        position: items.length + 1,
        name: name,
        url: href || undefined,
        image: img || undefined
      });
    });

    if (items.length === 0) return null;

    return { '@type': 'ItemList', name: 'Recommended products', itemListElement: items };
  }

  function mergeIntoGraph(productObj, breadcrumbSchema, faqSchema, orgSchema, itemListSchema) {
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

    return { '@context': 'https://schema.org', '@graph': graph };
  }

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

  document.addEventListener('DOMContentLoaded', function () {
    var found = findProductJsonLd();
    var targetScriptNode = found.targetScriptNode;
    var parsedJsonLd = found.parsedJsonLd;
    var graphIndex = found.graphIndex;

    var breadcrumbSchema = buildBreadcrumbSchema();
    var orgSchema = buildOrganizationSchema();
    var itemListSchema = buildItemListSchema();
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
          var hasOrg = parsedJsonLd['@graph'].some(function (g) {
            return g['@type'] === 'Organization';
          });
          if (!hasOrg) parsedJsonLd['@graph'].unshift(orgSchema);
        }

        if (breadcrumbSchema) {
          var hasBreadcrumb = parsedJsonLd['@graph'].some(function (g) {
            return g['@type'] === 'BreadcrumbList';
          });
          if (!hasBreadcrumb) parsedJsonLd['@graph'].push(breadcrumbSchema);
        }

        if (faqSchema) parsedJsonLd['@graph'].push(faqSchema);
        if (itemListSchema) parsedJsonLd['@graph'].push(itemListSchema);

        var ingredientProps = buildIngredientProperties();
        if (ingredientProps.length > 0) {
          parsedJsonLd['@graph'][graphIndex].additionalProperty = ingredientProps;
        }

        if (orgSchema) {
          var prod = parsedJsonLd['@graph'][graphIndex];
          if (prod.brand) prod.brand['@id'] = orgSchema['@id'];
          prod.manufacturer = { '@type': 'Organization', '@id': orgSchema['@id'] };
        }
      } else {
        parsedJsonLd = mergeIntoGraph(
          patchProductSchema(parsedJsonLd),
          breadcrumbSchema,
          faqSchema,
          orgSchema,
          itemListSchema
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
        breadcrumbSchema,
        faqSchema,
        orgSchema,
        itemListSchema
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
    }
  });
})();
