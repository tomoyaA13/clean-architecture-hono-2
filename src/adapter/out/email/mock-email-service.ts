import { SendEmailPort, EmailMessage, EmailResult } from '../../../application/port/out/send-email-port';

/**
 * テスト・開発用のモックメールサービス
 * 実際にはメールを送信せず、コンソールにログを出力
 */
export class MockEmailService implements SendEmailPort {
  private sentEmails: EmailMessage[] = [];
  private failNextSend: boolean = false;

  async send(message: EmailMessage): Promise<EmailResult> {
    // エラーシミュレーション
    if (this.failNextSend) {
      this.failNextSend = false;
      console.error('📧 [Mock] メール送信失敗をシミュレート');
      return {
        id: '',
        success: false,
        error: 'モック：メール送信に失敗しました',
      };
    }

    // メール内容をコンソールに出力
    console.log('📧 [Mock Email Service] メール送信をシミュレート');
    console.log('=====================================');
    console.log(`To: ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    if (message.replyTo) {
      console.log(`Reply-To: ${message.replyTo}`);
    }
    console.log('-------------------------------------');
    console.log('HTML Content:');
    console.log(this.formatHtmlForConsole(message.html));
    console.log('=====================================');
    console.log(`✅ メールID: mock_${Date.now()}`);
    console.log('');

    // 送信履歴に追加
    this.sentEmails.push({
      ...message,
      timestamp: new Date().toISOString(),
    } as EmailMessage & { timestamp: string });

    // 成功レスポンスを返す
    return {
      id: `mock_${Date.now()}`,
      success: true,
    };
  }

  /**
   * HTMLを見やすくコンソール出力用にフォーマット
   */
  private formatHtmlForConsole(html: string): string {
    // 基本的なHTMLタグを除去して読みやすくする
    return html
      .replace(/<[^>]*>/g, '') // HTMLタグを削除
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ') // 連続する空白を1つに
      .trim();
  }

  /**
   * 送信されたメールの履歴を取得
   */
  getSentEmails(): EmailMessage[] {
    return [...this.sentEmails];
  }

  /**
   * 最後に送信されたメールを取得
   */
  getLastSentEmail(): EmailMessage | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  /**
   * 特定の宛先に送信されたメールを取得
   */
  getEmailsSentTo(email: string): EmailMessage[] {
    return this.sentEmails.filter((msg) => msg.to === email);
  }

  /**
   * 送信履歴をクリア
   */
  clearSentEmails(): void {
    this.sentEmails = [];
    console.log('📧 [Mock] 送信履歴をクリアしました');
  }

  /**
   * 次回の送信を失敗させる（テスト用）
   */
  simulateFailure(): void {
    this.failNextSend = true;
    console.log('⚠️ [Mock] 次回のメール送信は失敗します');
  }

  /**
   * 統計情報を表示
   */
  printStatistics(): void {
    console.log('📊 [Mock Email Service] 統計情報');
    console.log(`総送信数: ${this.sentEmails.length}`);

    if (this.sentEmails.length > 0) {
      const uniqueRecipients = new Set(this.sentEmails.map((e) => e.to));
      console.log(`ユニーク受信者数: ${uniqueRecipients.size}`);

      const subjects = this.sentEmails.map((e) => e.subject);
      const uniqueSubjects = new Set(subjects);
      console.log(`ユニーク件名数: ${uniqueSubjects.size}`);

      console.log('受信者リスト:');
      uniqueRecipients.forEach((recipient) => {
        const count = this.sentEmails.filter((e) => e.to === recipient).length;
        console.log(`  - ${recipient}: ${count}通`);
      });
    }
  }
}
