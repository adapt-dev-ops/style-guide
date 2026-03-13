/* ============================================================
schema-patch.js
역할: Product / BreadcrumbList / FAQPage 스키마 통합 관리
방식: 기존 카페24 JSON-LD를 패치하고, 없으면 새로 생성
의존: jQuery
============================================================ */

(function ($) {
    'use strict';
  
  
    /* ----------------------------------------------------------
       유틸리티
    ---------------------------------------------------------- */
  
    // 문자열에서 숫자만 추출
    function extractNumber(val) {
      var str = String(val || '').replace(/[^\d]/g, '');
      return str ? parseInt(str, 10) : null;
    }
  
    // 텍스트 정제 — 연속 공백/줄바꿈/특수 공백 제거
    function cleanText(text) {
      return String(text || '')
        .replace(/\u00a0/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
  
    // 다음 해 날짜 반환 (priceValidUntil용)
    function nextYearDate() {
      var d = new Date();
      d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    }
  
  
    /* ----------------------------------------------------------
       Product 스키마 패치
    ---------------------------------------------------------- */
  
    function patchProductSchema(productObj) {
      // 실제 마크업 기준 셀렉터
      var titleText    = cleanText($('h1.info-title').text());
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
  
      // Offers 초기화
      if (!productObj.offers) productObj.offers = { '@type': 'Offer' };
      if ($.isArray(productObj.offers)) productObj.offers = productObj.offers[0] || { '@type': 'Offer' };
  
      productObj.offers.url             = productObj.offers.url             || canonUrl;
      productObj.offers.priceCurrency   = productObj.offers.priceCurrency   || 'KRW';
      productObj.offers.priceValidUntil = productObj.offers.priceValidUntil || nextYearDate();
  
      if ((!productObj.offers.price || productObj.offers.price === '') && sellingPrice !== null) {
        productObj.offers.price = String(sellingPrice);
      }
  
      if (!productObj.offers.availability) {
        productObj.offers.availability = isSoldOut
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock';
      }
  
      // 배송비 — ec-data-delivery 속성 또는 무료배송 fallback
      if (!productObj.offers.shippingDetails) {
        var shippingPrice = extractNumber($('[ec-data-delivery]').first().attr('ec-data-delivery'));
        if (shippingPrice === null) shippingPrice = 0;
        productObj.offers.shippingDetails = {
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
  
      $('.breadcrumb a, nav.breadcrumb a, .path a').each(function (index) {
        var name = cleanText($(this).text());
        var href = $(this).attr('href') || '';
  
        if (!name) return;
  
        if (href && href.indexOf('http') !== 0) {
          href = location.origin + (href.charAt(0) === '/' ? '' : '/') + href;
        }
  
        items.push({
          '@type'  : 'ListItem',
          position : index + 1,
          name     : name,
          item     : href || undefined
        });
      });
  
      if (items.length === 0) return null;
  
      return { '@type': 'BreadcrumbList', itemListElement: items };
    }
  
  
    /* ----------------------------------------------------------
       FAQPage 스키마 생성
    ---------------------------------------------------------- */
  
    function buildFaqSchema($container) {
      var faqItems = [];
  
      $container.find('.js-accordion-item').each(function () {
        var $item    = $(this);
        var question = cleanText($item.find('.adt-accordion-header').text());
        var answer   = cleanText($item.next('.js-accordion-panel').find('.adt-accordion-content').text());
  
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
       @graph 통합 헬퍼
    ---------------------------------------------------------- */
  
    function mergeIntoGraph(productObj, breadcrumbSchema, faqSchema) {
      var graph = [productObj];
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
  
          // 단일 Product 객체
          if (json['@type'] === 'Product' ||
             ($.isArray(json['@type']) && json['@type'].indexOf('Product') > -1)) {
            targetScriptNode = this;
            parsedJsonLd     = json;
            return false;
          }
  
          // @graph 배열 내 Product
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
      var faqSchema        = null;
      var $faq             = $('.js-faq-container');
  
      if ($faq.length) {
        $('#common_info').after($faq);
        faqSchema = buildFaqSchema($faq);
      }
  
      // 3. 기존 스키마 패치 및 DOM 반영
      if (parsedJsonLd) {
  
        // @graph 구조
        if (graphIndex > -1) {
          parsedJsonLd['@graph'][graphIndex] = patchProductSchema(parsedJsonLd['@graph'][graphIndex]);
  
          if (breadcrumbSchema) {
            var hasBreadcrumb = parsedJsonLd['@graph'].some(function (g) {
              return g['@type'] === 'BreadcrumbList';
            });
            if (!hasBreadcrumb) parsedJsonLd['@graph'].push(breadcrumbSchema);
          }
          if (faqSchema) parsedJsonLd['@graph'].push(faqSchema);
  
        // 단일 객체 구조 → @graph로 변환
        } else {
          parsedJsonLd = mergeIntoGraph(
            patchProductSchema(parsedJsonLd),
            breadcrumbSchema,
            faqSchema
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
          faqSchema
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