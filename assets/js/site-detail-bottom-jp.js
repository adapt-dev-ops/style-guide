/* ============================================================
schema-patch-jp.js
역할: Product / BreadcrumbList / FAQPage / Organization 스키마 통합 관리 (일본 전용)
방식: 기존 카페24 JSON-LD를 패치하고, 없으면 새로 생성
브랜드: 도메인 기준 자동 분기 (foodology.jp / obge.jp)
의존: jQuery
============================================================ */

(function ($) {
    'use strict';
  
    /* ----------------------------------------------------------
       브랜드 분기 설정
    ---------------------------------------------------------- */
  
    var BRAND_CONFIG = (function () {
      var host = location.hostname; // e.g. "foodology.jp" or "obge.jp"
  
      var configs = {
        'foodology': {
          email     : 'foodology_jp@adaptkorea.com',
          instagram : 'https://www.instagram.com/foodology.japan/'
        },
        'obge': {
          email     : 'obge_jp@adaptkorea.com',
          instagram : 'https://www.instagram.com/obge_jp/'
        }
      };
  
      // 도메인에 포함된 키워드로 브랜드 판별
      var matched = 'foodology'; // 기본값
      Object.keys(configs).forEach(function (key) {
        if (host.indexOf(key) > -1) matched = key;
      });
  
      return configs[matched];
    })();
  
  
    /* ----------------------------------------------------------
       유틸리티
    ---------------------------------------------------------- */
  
    function extractNumber(val) {
      var str = String(val || '').replace(/[^\d]/g, '');
      return str ? parseInt(str, 10) : null;
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
  
  
    /* ----------------------------------------------------------
       Offer 단건 패치 헬퍼
    ---------------------------------------------------------- */
  
    function patchOffer(offer, canonUrl) {
      offer['@type']        = offer['@type']        || 'Offer';

      // Cafe24 placeholder 이미지 제거
      if (offer.image && (offer.image.indexOf('img_product_big.gif') > -1 || offer.image.indexOf('echosting.cafe24.com/thumb') > -1)) {
        delete offer.image;
      }
      offer.url             = offer.url             || canonUrl;
      offer.priceCurrency   = offer.priceCurrency   || 'JPY';
      offer.priceValidUntil = offer.priceValidUntil || nextYearDate();
  
      // availability 정규화
      if (!offer.availability || offer.availability === 'InStock') {
        offer.availability = 'https://schema.org/InStock';
      }
      if (offer.availability === 'OutOfStock') {
        offer.availability = 'https://schema.org/OutOfStock';
      }
  
      // 신상품 명시
      offer.itemCondition = offer.itemCondition || 'https://schema.org/NewCondition';
  
      // 배송비 — ¥3,000 이상 무료, 미만 ¥300
      var isFreeShipping = offer.price && Number(offer.price) >= 3000;
      var shippingValue  = isFreeShipping ? 0 : 300;
  
      if (!offer.shippingDetails) {
        offer.shippingDetails = {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type'  : 'MonetaryAmount',
            value    : shippingValue,
            currency : 'JPY'
          },
          shippingDestination: {
            '@type'        : 'DefinedRegion',
            addressCountry : 'JP'
          }
        };
      } else {
        if (offer.shippingDetails.shippingRate) {
          offer.shippingDetails.shippingRate.value    = shippingValue;
          offer.shippingDetails.shippingRate.currency = 'JPY';
        }
        if (offer.shippingDetails.shippingDestination) {
          offer.shippingDetails.shippingDestination.addressCountry = 'JP';
        }
      }
  
      // 배송 기간
      if (!offer.deliveryTime) {
        offer.deliveryTime = {
          '@type'      : 'ShippingDeliveryTime',
          handlingTime : {
            '@type'   : 'QuantitativeValue',
            minValue  : 0,
            maxValue  : 1,
            unitCode  : 'DAY'
          },
          transitTime : {
            '@type'   : 'QuantitativeValue',
            minValue  : 1,
            maxValue  : 2,
            unitCode  : 'DAY'
          }
        };
      }
  
      // 반품 정책 — 7일 이내 이메일/LINE 문의 / 항상 덮어쓰기
      offer.hasMerchantReturnPolicy = {
        '@type'              : 'MerchantReturnPolicy',
        applicableCountry    : 'JP',
        returnPolicyCategory : 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays   : 7,
        returnMethod         : 'https://schema.org/ReturnByMail',
        returnFees           : 'https://schema.org/FreeReturn',
        returnPolicySeasonalOverride: {
          '@type'     : 'MerchantReturnPolicySeasonalOverride',
          description : '商品到着後、ご注文内容と異なる場合や商品に不備があった場合は、7日以内に公式カスタマーサポート（メールまたはLINE）までお問い合わせください。'
        }
      };
  
      return offer;
    }
  
  
    /* ----------------------------------------------------------
       Product 스키마 패치
    ---------------------------------------------------------- */
  
    function patchProductSchema(productObj) {
      var titleText    = cleanText($('h1').text());
      var descText     = cleanText(
        $('meta[property="og:description"]').attr('content') ||
        $('meta[name="description"]').attr('content') || ''
      );
      var canonUrl     = $('link[rel="canonical"]').attr('href') || (location.origin + location.pathname + location.search);
      var isSoldOut    = $('.ec-base-button.soldout').length > 0 && !$('.ec-base-button.soldout').hasClass('displaynone');
      var sellingPrice = extractNumber($('[ec-data-price]').first().attr('ec-data-price'));
  
      // 기본 정보
      if (!productObj.name && titleText)       productObj.name        = titleText;
      if (!productObj.description && descText) productObj.description = descText;
      if (!productObj.url)                     productObj.url         = canonUrl;
  
      // SKU — URL에서 product_no 추출
      if (!productObj.sku) {
        var productNo = (location.search.match(/product_no=(\d+)/) || [])[1];
        if (productNo) productObj.sku = productNo;
      }
  
      // 이미지 — Cafe24 placeholder 감지 시 OG 메타로 교체
      function isPlaceholderImage(img) {
        if (!img) return true;
        var urls = Array.isArray(img) ? img : [img];
        return urls.length === 0 || urls.every(function (u) {
          return !u || u.indexOf('img_product_big.gif') > -1 || u.indexOf('echosting.cafe24.com/thumb') > -1;
        });
      }
      if (isPlaceholderImage(productObj.image)) {
        var images = [];
        $('meta[property="og:image"]').each(function () {
          var content = $(this).attr('content');
          if (content && images.indexOf(content) === -1) images.push(content);
        });
        if (images.length > 0) productObj.image = images;
      }
  
      // 브랜드 — OG 메타 태그 활용
      if (!productObj.brand) {
        var siteName = $('meta[property="og:site_name"]').attr('content');
        if (siteName) productObj.brand = { '@type': 'Brand', name: siteName };
      }
  
      // Offers — 배열/단일 모두 대응
      if (!productObj.offers) productObj.offers = { '@type': 'Offer' };
  
      if ($.isArray(productObj.offers)) {
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
  
      // 크리마 리뷰 평점 (aggregateRating)
      var $cremaWrap = $('.crema-product-reviews-score-wrap').first();
      if ($cremaWrap.length > 0 && !productObj.aggregateRating) {
        var scoreVal  = parseFloat($cremaWrap.find('div').text());
        var reviewCnt = extractNumber($cremaWrap.find('a').text());
        if (!isNaN(scoreVal) && reviewCnt !== null) {
          productObj.aggregateRating = {
            '@type'     : 'AggregateRating',
            ratingValue : String(scoreVal),
            reviewCount : String(reviewCnt)
          };
        }
      }
  
      return productObj;
    }
  
  
    /* ----------------------------------------------------------
       BreadcrumbList 스키마 생성
    ---------------------------------------------------------- */
  
    function buildBreadcrumbSchema() {
      var items = [];
  
      items.push({
        '@type'  : 'ListItem',
        position : 1,
        name     : 'Home',
        item     : location.origin + '/'
      });
  
      [1, 2, 3].forEach(function (depth) {
        var $p   = $('#cateNum_' + depth);
        var name = cleanText($p.attr('name') || '');
        var num  = cleanText($p.text());
  
        if (!name || !num) return;
  
        items.push({
          '@type'  : 'ListItem',
          position : items.length + 1,
          name     : name,
          item     : location.origin + '/category/' + encodeURIComponent(name) + '/' + num + '/'
        });
      });
  
      items.push({
        '@type'  : 'ListItem',
        position : items.length + 1,
        name     : cleanText($('h1').text()),
        item     : $('link[rel="canonical"]').attr('href') || (location.origin + location.pathname + location.search)
      });
  
      return { '@type': 'BreadcrumbList', itemListElement: items };
    }
  
  
    /* ----------------------------------------------------------
       FAQPage 스키마 생성
    ---------------------------------------------------------- */
  
    function buildFaqSchema($container) {
      var faqItems = [];
  
      $container.find('dt.adtAccordionItem').each(function () {
        var $dt      = $(this);
        var question = cleanText($dt.find('.adtAccordionHeader').text());
        var answer   = cleanText($dt.next('dd.adtAccordionPanel').find('.adt-accordion-content').text());
  
        if (question && answer) {
          faqItems.push({
            '@type'        : 'Question',
            name           : question,
            acceptedAnswer : { '@type': 'Answer', text: answer }
          });
        }
      });
  
      if (faqItems.length === 0) return null;
  
      return { '@type': 'FAQPage', mainEntity: faqItems };
    }
  
  
    /* ----------------------------------------------------------
       Organization 스키마 생성 (일본 전용 — 브랜드 분기)
    ---------------------------------------------------------- */
  
    function buildOrganizationSchema() {
      var origin   = location.origin;
      var siteName = cleanText($('meta[property="og:site_name"]').attr('content') || '');
  
      if (!siteName) return null;
  
      var org = {
        '@type' : 'Organization',
        '@id'   : origin + '/#organization',
        name    : siteName,
        url     : origin
      };
  
      // 로고
      var logo = $('meta[property="og:image"]').first().attr('content');
      if (logo) {
        org.logo = { '@type': 'ImageObject', url: logo };
      }
  
      // 주소 — 공통 고정값
      org.address = {
        '@type'         : 'PostalAddress',
        streetAddress   : '4F, 534 Samseong-ro',
        addressLocality : 'Gangnam-gu',
        addressRegion   : 'Seoul',
        postalCode      : '06166',
        addressCountry  : 'KR'
      };
  
      // 이메일 / SNS — 브랜드별 분기
      org.email  = BRAND_CONFIG.email;
      org.sameAs = [BRAND_CONFIG.instagram];
  
      return org;
    }
  
  
    /* ----------------------------------------------------------
       성분 정보 구조화 (PropertyValue)
    ---------------------------------------------------------- */
  
    function buildIngredientProperties() {
      var props = [];
  
      $('.adt-infotable .adt-infotable-row').each(function () {
        var label = cleanText($(this).find('.adt-infotable-label').text());
        var value = cleanText($(this).find('.adt-infotable-value').text());
  
        if (!label || !value) return;
  
        var targets = ['原材料名', '内容量', '商品名', '摂取目安量'];
        var match   = targets.some(function (t) { return label === t || label.indexOf(t) === 0; });
        if (!match) return;
  
        props.push({
          '@type' : 'PropertyValue',
          name    : label,
          value   : value
        });
      });
  
      return props;
    }
  
  
    /* ----------------------------------------------------------
       ItemList 스키마 생성 (추천 상품)
    ---------------------------------------------------------- */
  
    function buildItemListSchema() {
      var items = [];
  
      $('#prd_recommend .swiper-slide').each(function (i) {
        var $slide = $(this);
        var name   = cleanText($slide.find('.info-box h3').text());
        var href   = $slide.find('a').first().attr('href') || '';
        var img    = $slide.find('img').first().attr('src') || '';
  
        if (!name) return;
  
        if (href && href.indexOf('http') !== 0) {
          href = location.origin + (href.charAt(0) === '/' ? '' : '/') + href;
        }
        if (img && img.indexOf('http') !== 0) {
          img = 'https:' + img;
        }
  
        items.push({
          '@type'  : 'ListItem',
          position : i + 1,
          name     : name,
          url      : href || undefined,
          image    : img  || undefined
        });
      });
  
      if (items.length === 0) return null;
  
      return { '@type': 'ItemList', name: 'おすすめ商品', itemListElement: items };
    }
  
  
    /* ----------------------------------------------------------
       @graph 통합 헬퍼
    ---------------------------------------------------------- */
  
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
      if (faqSchema)        graph.push(faqSchema);
      if (itemListSchema)   graph.push(itemListSchema);
  
      return { '@context': 'https://schema.org', '@graph': graph };
    }
  
  
    /* ----------------------------------------------------------
       메인 실행
    ---------------------------------------------------------- */
  
    $(function () {
      var targetScriptNode = null;
      var parsedJsonLd     = null;
      var graphIndex       = -1;
  
      // 1. 기존 Product JSON-LD 탐색
      $('script[type="application/ld+json"]').each(function () {
        try {
          var json = JSON.parse(this.textContent);
  
          if (json['@type'] === 'Product' ||
             ($.isArray(json['@type']) && json['@type'].indexOf('Product') > -1)) {
            targetScriptNode = this;
            parsedJsonLd     = json;
            return false;
          }
  
          if (json['@graph'] && $.isArray(json['@graph'])) {
            for (var k = 0; k < json['@graph'].length; k++) {
              var item = json['@graph'][k];
              if (item && (item['@type'] === 'Product' ||
                 ($.isArray(item['@type']) && item['@type'].indexOf('Product') > -1))) {
                targetScriptNode = this;
                parsedJsonLd     = json;
                graphIndex       = k;
                return false;
              }
            }
          }
        } catch (e) { /* JSON 파싱 오류 무시 */ }
      });
  
      // 2. 부가 스키마 생성
      var breadcrumbSchema = buildBreadcrumbSchema();
      var orgSchema        = buildOrganizationSchema();
      var itemListSchema   = buildItemListSchema();
      var faqSchema        = null;
      var $faq             = $('.adtFaqContainer');
  
      if ($faq.length) {
        $('#common_info').after($faq);
        faqSchema = buildFaqSchema($faq);
      }
  
      // 3. 기존 스키마 패치 및 DOM 반영
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
  
          if (faqSchema)      parsedJsonLd['@graph'].push(faqSchema);
          if (itemListSchema) parsedJsonLd['@graph'].push(itemListSchema);
  
          // 성분 정보 추가
          var ingredientProps = buildIngredientProperties();
          if (ingredientProps.length > 0) {
            parsedJsonLd['@graph'][graphIndex].additionalProperty = ingredientProps;
          }
  
          // Organization @id 연결
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
  
        $(targetScriptNode).text(JSON.stringify(parsedJsonLd));
  
        // 빈 커스텀 슬롯 정리
        var $slot    = $('#pd-schema-product');
        var slotText = cleanText($slot.text());
        if ($slot.length && (!slotText || slotText === '{}' || slotText === '{"@context":"https://schema.org"}')) {
          $slot.remove();
        }
  
      // 4. 기존 스키마 없을 때 — 새로 생성
      } else {
        var newSchema = mergeIntoGraph(
          patchProductSchema({ '@context': 'https://schema.org', '@type': 'Product' }),
          breadcrumbSchema,
          faqSchema,
          orgSchema,
          itemListSchema
        );
  
        if ($('#pd-schema-product').length) {
          $('#pd-schema-product').text(JSON.stringify(newSchema));
        } else {
          $('<script/>', { type: 'application/ld+json', id: 'pd-schema-product' })
            .text(JSON.stringify(newSchema))
            .appendTo('head');
        }
      }
  
    });
  })(jQuery);