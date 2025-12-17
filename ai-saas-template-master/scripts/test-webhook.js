#!/usr/bin/env node

/**
 * Stripe Webhook测试脚本
 * 用于测试webhook处理逻辑
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

async function testWebhook() {
  console.log('🧪 开始测试Stripe Webhook...\n')

  try {
    // 1. 测试创建客户
    console.log('1️⃣ 创建测试客户...')
    const customer = await stripe.customers.create({
      email: 'test@example.com',
      name: 'Test User',
      metadata: {
        userId: 'test_user_123',
      },
    })
    console.log(`✅ 客户创建成功: ${customer.id}\n`)

    // 2. 测试创建产品和价格
    console.log('2️⃣ 创建测试产品和价格...')
    const product = await stripe.products.create({
      name: 'Test Professional Plan',
      description: '测试专业版计划',
    })

    const price = await stripe.prices.create({
      unit_amount: 9900, // $99.00
      currency: 'cny',
      product: product.id,
      nickname: 'Professional Monthly',
    })
    console.log(`✅ 产品创建成功: ${product.id}`)
    console.log(`✅ 价格创建成功: ${price.id}\n`)

    // 3. 测试创建支付会话
    console.log('3️⃣ 创建测试支付会话...')
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url:
        'http://localhost:3000/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/payment/cancelled',
      metadata: {
        userId: 'test_user_123',
        planName: 'Professional',
        currency: 'cny',
        paymentMethod: 'card',
        membershipDurationDays: '30',
      },
    })
    console.log(`✅ 支付会话创建成功: ${session.id}`)
    console.log(`🔗 支付链接: ${session.url}\n`)

    // 4. 模拟webhook事件
    console.log('4️⃣ 模拟webhook事件...')

    // 模拟checkout.session.completed事件
    const mockEvent = {
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2020-08-27',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: session.id,
          object: 'checkout.session',
          amount_total: 9900,
          currency: 'cny',
          customer: customer.id,
          mode: 'payment',
          payment_intent: 'pi_test_123456789',
          payment_status: 'paid',
          status: 'complete',
          metadata: {
            userId: 'test_user_123',
            planName: 'Professional',
            currency: 'cny',
            paymentMethod: 'card',
            membershipDurationDays: '30',
          },
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_123',
        idempotency_key: null,
      },
      type: 'checkout.session.completed',
    }

    console.log('📦 模拟事件数据:')
    console.log(JSON.stringify(mockEvent, null, 2))
    console.log('\n')

    // 5. 测试webhook端点
    console.log('5️⃣ 测试webhook端点...')
    console.log('💡 请手动测试以下步骤:')
    console.log('1. 启动开发服务器: npm run dev')
    console.log('2. 使用ngrok暴露本地端点: ngrok http 3000')
    console.log('3. 在Stripe Dashboard中配置webhook端点')
    console.log('4. 使用上面的支付链接完成测试支付')
    console.log('5. 检查webhook是否正确处理事件\n')

    // 6. 清理测试数据
    console.log('6️⃣ 清理测试数据...')
    await stripe.prices.update(price.id, { active: false })
    await stripe.products.update(product.id, { active: false })
    console.log('✅ 测试数据清理完成\n')

    console.log('🎉 Webhook测试脚本执行完成！')
    console.log('📝 请按照上述步骤手动测试完整的支付流程。')
  } catch (error) {
    console.error('❌ 测试失败:', error.message)
    process.exit(1)
  }
}

// 检查环境变量
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ 请设置 STRIPE_SECRET_KEY 环境变量')
  process.exit(1)
}

// 运行测试
testWebhook()
