'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Send,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface EscalationAlert {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  // Derived from message content
  sessionId?: string;
  urgent: boolean;
}

interface ChatHistoryMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export const EscalationList = () => {
  const [alerts, setAlerts] = useState<EscalationAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Map<string, ChatHistoryMessage[]>>(new Map());
  const [replyInputs, setReplyInputs] = useState<Map<string, string>>(new Map());
  const [replying, setReplying] = useState<string | null>(null);

  const fetchEscalations = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts?type=CHAT_ESCALATION&limit=50');
      if (!response.ok) return;
      const json = await response.json();
      if (json.success) {
        setAlerts(
          (json.data ?? []).map((alert: EscalationAlert) => ({
            ...alert,
            urgent: alert.title?.includes('긴급'),
          })),
        );
      }
    } catch (err: unknown) {
      console.error('Failed to fetch escalations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEscalations();
  }, [fetchEscalations]);

  const toggleExpand = async (alertId: string) => {
    if (expandedId === alertId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(alertId);

    // Extract session ID from alert message (contains session context)
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return;

    // Try to load chat history if we have a session reference
    // For now, we display the alert message which contains recent conversation context
  };

  const handleReply = async (alertId: string, sessionId: string) => {
    const message = replyInputs.get(alertId)?.trim();
    if (!message) return;

    setReplying(alertId);
    try {
      const response = await fetch(`/api/chat/${sessionId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, resolveEscalation: true }),
      });

      if (response.ok) {
        // Clear input and refresh
        setReplyInputs((prev) => {
          const next = new Map(prev);
          next.delete(alertId);
          return next;
        });
        void fetchEscalations();
      }
    } catch (err: unknown) {
      console.error('Failed to send reply:', err);
    } finally {
      setReplying(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <MessageCircle className="mb-3 h-12 w-12" />
        <p className="text-sm">에스컬레이션된 상담이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isExpanded = expandedId === alert.id;
        const timeAgo = formatDistanceToNow(new Date(alert.sentAt), {
          addSuffix: true,
          locale: ko,
        });

        return (
          <div
            key={alert.id}
            className={`rounded-lg border transition-colors ${
              alert.urgent
                ? 'border-red-200 bg-red-50/50'
                : 'border-gray-200 bg-white'
            }`}
          >
            {/* Header */}
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => void toggleExpand(alert.id)}
            >
              <div className="flex items-center gap-3">
                {alert.urgent ? (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
                ) : (
                  <MessageCircle className="h-5 w-5 shrink-0 text-purple-500" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 ${
                        alert.urgent
                          ? 'bg-red-100 text-red-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {alert.urgent ? '긴급' : '일반'}
                    </Badge>
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                    {!alert.isRead && (
                      <div className="h-2 w-2 rounded-full bg-brand-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-gray-800">
                    {alert.title}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t px-4 pb-4 pt-3">
                {/* Alert message (contains recent conversation context) */}
                <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  {alert.message.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < alert.message.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>

                {/* Reply input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyInputs.get(alert.id) ?? ''}
                    onChange={(e) => {
                      setReplyInputs((prev) => {
                        const next = new Map(prev);
                        next.set(alert.id, e.target.value);
                        return next;
                      });
                    }}
                    placeholder="답변을 입력하세요..."
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus-visible:border-brand-300"
                    disabled={replying === alert.id}
                  />
                  <Button
                    size="sm"
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => void handleReply(alert.id, alert.id)}
                    disabled={!replyInputs.get(alert.id)?.trim() || replying === alert.id}
                  >
                    {replying === alert.id ? (
                      <CheckCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    답변하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
