/* ============================================================
schema-patch.js
역할: Product / BreadcrumbList / FAQPage / Organization 스키마 통합 관리
방식: 기존 카페24 JSON-LD를 패치하고, 없으면 새로 생성
의존: jQuery
============================================================ */

(function ($) {
  'use strict';

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
    offer.url             = offer.url             || canonUrl;
    offer.priceCurrency   = offer.priceCurrency   || 'KRW';
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

    // 배송비 — 기존 shippingDetails가 있어도 value가 0이면 실제 배송비로 덮어쓰기
    var shippingPrice = extractNumber($('[ec-data-delivery]').first().attr('ec-data-delivery'));
    if (shippingPrice === null) shippingPrice = 3000;

    if (!offer.shippingDetails) {
      offer.shippingDetails = {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type'  : 'MonetaryAmount',
          value    : shippingPrice,
          currency : 'KRW'
        },
        shippingDestination: {
          '@type'        : 'DefinedRegion',
          addressCountry : 'KR'
        }
      };
    } else {
      if (offer.shippingDetails.shippingRate && offer.shippingDetails.shippingRate.value === 0) {
        offer.shippingDetails.shippingRate.value = shippingPrice;
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

    // 반품 정책
    if (!offer.hasMerchantReturnPolicy) {
      offer.hasMerchantReturnPolicy = {
        '@type'              : 'MerchantReturnPolicy',
        applicableCountry    : 'KR',
        returnPolicyCategory : 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays   : 7,
        returnMethod         : 'https://schema.org/ReturnByMail',
        returnFees           : 'https://schema.org/FreeReturn'
      };
    }

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

    // 이미지 — OG 메타 태그 활용
    if (!productObj.image || productObj.image.length === 0) {
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

    // 대표 리뷰 — 풀리 브랜드에만 적용 (크리마 iframe 크로스도메인 제약으로 자동 수집 불가)
    if (!productObj.review && location.hostname.indexOf('full-y.co.kr') > -1) {
      productObj.review = [
        {
          '@type'      : 'Review',
          reviewRating : { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
          name         : '아주 좋아요',
          reviewBody   : '이렇게 좋은 수분선크림이 있는거 왜 아무도 안 알려주셨나요. 제가 이제껏 써본 수분선크림 중에 저랑 제일 잘 맞아서 구매하길 잘했다는 생각이 들었어요. 실키하게 부드럽게 발리고 끈적임이 전혀 없어서 밀림 걱정 없어요. 사계절 내내 쓸 수 있을 것 같아요.',
          author       : { '@type': 'Person', name: 'trrt****' }
        },
        {
          '@type'      : 'Review',
          reviewRating : { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
          name         : '아주 좋아요',
          reviewBody   : '지금까지 써본 선크림 중에 제일 좋아요. 선크림이라고 말 안하면 수분크림 바르는 느낌이에요. 촉촉하고 흡수력이 좋고, 화장 전에 발라도 밀림이나 들뜸이 전혀 없어요. 백탁현상도 없고 눈 시림도 없어서 데일리로 사용하기 좋아요. 지성피부인 저도 문제없이 사용했고 피부타입에 관계없이 추천합니다.',
          author       : { '@type': 'Person', name: '유****' }
        },
        {
          '@type'      : 'Review',
          reviewRating : { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
          name         : '아주 좋아요',
          reviewBody   : '수부지 민감피부인데 가벼우면서 끈적이지 않는 선크림을 찾고 있었는데 딱 원하던 느낌이에요. 수분감이 풍부하면서도 마무리가 산뜻해요. 백탁 없이 피부에 스며들고, 화장 전에 발라도 밀림 없이 잘 올라가요. 자극에 민감한 분들도 사용 가능하고 무향이라 더 좋아요.',
          author       : { '@type': 'Person', name: '조****' }
        },
        {
          '@type'      : 'Review',
          reviewRating : { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
          name         : '아주 좋아요',
          reviewBody   : '아무 기대 없이 썼는데 로션 제형이라 촉촉하게 발리고 바르자마자 피부결이 정돈되는 느낌이에요. 건성이라 가벼운 선크림 쓰면 속건조가 심했는데 이건 수분감이 좋으면서도 끈적이지 않아요. 그 위에 베이스 올리면 착붙되고 밀림이나 뭉침이 없어요.',
          author       : { '@type': 'Person', name: '이****' }
        },
        {
          '@type'      : 'Review',
          reviewRating : { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
          name         : '아주 좋아요',
          reviewBody   : '안 무겁고 안 끈적거리는 선크림을 찾고 있었는데 딱 원하던 제품이에요. 백탁 없이 촉촉하게 스며들어서 화장도 안 밀리고 파데 바르면 물광처럼 표현돼요. 로션처럼 가벼워서 여름에도 부담 없이 사용할 수 있어요. 촉촉한 수분감, 끈적임 없는 마무리, 무향이라 남성도 사용하기 좋아요.',
          author       : { '@type': 'Person', name: 'gg****' }
        }
      ];
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
      name     : '홈',
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
     Organization 스키마 생성
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

    // 로고 — OG 이미지 fallback
    var logo = $('meta[property="og:image"]').first().attr('content');
    if (logo) {
      org.logo = {
        '@type' : 'ImageObject',
        url     : logo
      };
    }

    // 주소 — 고정값
    org.address = {
      '@type'           : 'PostalAddress',
      streetAddress     : '삼성로 534 (삼성동) 싹아트센터 4층',
      addressLocality   : '강남구',
      addressRegion     : '서울특별시',
      postalCode        : '06166',
      addressCountry    : 'KR'
    };

    // 이메일 — 고정값
    org.email = 'cs@adaptkorea.com';

    // 전화번호 — 푸터에서 자동 수집
    var phone = cleanText($('.footer-phone, .cs-phone, [class*="phone"]').first().text());
    if (phone) {
      org.contactPoint = {
        '@type'       : 'ContactPoint',
        telephone     : phone,
        contactType   : 'Customer Service',
        areaServed    : 'KR',
        availLanguage : 'Korean'
      };
    }

    // 이메일 — 푸터에서 자동 수집
    var emailEl = $('a[href^="mailto:"]').first();
    if (emailEl.length) {
      org.email = emailEl.attr('href').replace('mailto:', '');
    }

    // 소셜 프로필 — 풀리만 고정값, 다른 브랜드는 푸터에서 자동 수집
    var sameAs = [];
    if (location.hostname.indexOf('full-y.co.kr') > -1) {
      sameAs = ['https://www.instagram.com/fully___official'];
    } else {
      $('a[href*="instagram.com"], a[href*="youtube.com"], a[href*="facebook.com"], a[href*="tiktok.com"]').each(function () {
        var href = $(this).attr('href');
        if (href && sameAs.indexOf(href) === -1) sameAs.push(href);
      });
    }
    if (sameAs.length > 0) org.sameAs = sameAs;

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

      // 전성분(화장품), 원재료명(식품) 및 주요 항목만 포함
      var targets = ['전성분', '원재료명', '기능성', '용량', '제품명'];
      var match   = targets.some(function (t) { return label === t || label.indexOf(t) === 0; });
      if (!match) return;

      props.push({
        '@type' : 'PropertyValue',
        name    : label,
        value   : value
      });
    });

    // 핵심 성분 별도 강조 — 풀리만 적용
    if (location.hostname.indexOf('full-y.co.kr') > -1) {
      var keyIngredients = ['쌀겨수', '쌀PDRN', '쌀-세라마이드'];
      keyIngredients.forEach(function (ing) {
        props.push({
          '@type'     : 'PropertyValue',
          name        : '핵심 성분',
          value       : ing,
          description : ing + ' 함유'
        });
      });
    }

    return props;
  }


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
        '@type'    : 'ListItem',
        position   : i + 1,
        name       : name,
        url        : href || undefined,
        image      : img  || undefined
      });
    });

    if (items.length === 0) return null;

    return {
      '@type'           : 'ItemList',
      name              : '추천 제품',
      itemListElement   : items
    };
  }

  function mergeIntoGraph(productObj, breadcrumbSchema, faqSchema, orgSchema) {
    var graph = [];

    // Organization 먼저 — 다른 스키마가 참조할 수 있도록
    if (orgSchema) {
      graph.push(orgSchema);

      // Product brand / manufacturer에 @id 연결
      if (productObj.brand) {
        productObj.brand['@id'] = orgSchema['@id'];
      }
      productObj.manufacturer = { '@type': 'Organization', '@id': orgSchema['@id'] };
    }

    // 성분 정보 추가
    var ingredientProps = buildIngredientProperties();
    if (ingredientProps.length > 0) {
      productObj.additionalProperty = ingredientProps;
    }

    graph.push(productObj);
    if (breadcrumbSchema) graph.push(breadcrumbSchema);
    if (faqSchema)        graph.push(faqSchema);

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
    var itemListSchema   = location.hostname.indexOf('full-y.co.kr') > -1 ? buildItemListSchema() : null;
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

        // Organization 추가
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