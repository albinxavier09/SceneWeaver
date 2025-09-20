import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Paperclip } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Comment } from "@shared/schema";

interface CommentsPanelProps {
  selectedSceneId: string | null;
  onClose: () => void;
}

export default function CommentsPanel({ selectedSceneId, onClose }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/scenes", selectedSceneId, "comments"],
    enabled: !!selectedSceneId,
  }) as { data: Comment[] };

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSceneId || !newComment.trim()) return;
      return apiRequest("POST", `/api/scenes/${selectedSceneId}/comments`, {
        author: "You",
        content: newComment.trim(),
        resolved: false,
        position: { x: 0, y: 0 },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes", selectedSceneId, "comments"] });
      setNewComment("");
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, updates }: { commentId: string; updates: Partial<Comment> }) => {
      return apiRequest("PATCH", `/api/comments/${commentId}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes", selectedSceneId, "comments"] });
    },
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now.getTime() - commentDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour ago`;
    return `${Math.floor(diffMins / 1440)} day ago`;
  };

  const getAuthorColor = (author: string) => {
    const colors = {
      "Sarah Miller": "bg-amber-500",
      "John Doe": "bg-blue-500",
      "Alex Lee": "bg-green-500",
      "You": "bg-muted",
    };
    return colors[author as keyof typeof colors] || "bg-gray-500";
  };

  const getAuthorInitials = (author: string) => {
    return author.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col" data-testid="comments-panel">
      {/* Panel Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Comments</h3>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-comments">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!selectedSceneId ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-muted-foreground text-center">
            Select a scene to view comments
          </p>
        </div>
      ) : (
        <>
          {/* Comments List */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {(comments as Comment[]).length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No comments yet</p>
                <p className="text-sm">Be the first to leave feedback!</p>
              </div>
            ) : (
              (comments as Comment[]).map((comment) => (
                <div
                  key={comment.id}
                  className={`rounded-lg p-3 border ${
                    comment.resolved
                      ? "bg-green-50 border-green-200 opacity-75"
                      : comment.author === "Sarah Miller"
                      ? "bg-amber-50 border-amber-200"
                      : comment.author === "John Doe"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-secondary border-border"
                  }`}
                  data-testid={`comment-${comment.id}`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${getAuthorColor(comment.author)}`}
                    >
                      {getAuthorInitials(comment.author)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium" data-testid={`comment-author-${comment.id}`}>
                          {comment.author}
                        </span>
                        <span className="text-xs text-muted-foreground" data-testid={`comment-time-${comment.id}`}>
                          {formatTimeAgo(comment.createdAt || new Date())}
                        </span>
                        {comment.resolved && (
                          <span className="text-xs bg-green-100 text-green-800 px-1 rounded">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground mb-2" data-testid={`comment-content-${comment.id}`}>
                        {comment.content}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="link"
                          size="sm"
                          className="text-xs p-0 h-auto"
                          data-testid={`button-reply-${comment.id}`}
                        >
                          Reply
                        </Button>
                        {!comment.resolved && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-xs p-0 h-auto"
                            onClick={() => updateCommentMutation.mutate({
                              commentId: comment.id,
                              updates: { resolved: true }
                            })}
                            data-testid={`button-resolve-${comment.id}`}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Comment */}
          <div className="p-4 border-t border-border">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm font-medium">
                You
              </div>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full text-sm bg-secondary border-0 rounded-md resize-none"
                  rows={3}
                  placeholder="Add a comment..."
                  data-testid="textarea-new-comment"
                />
                <div className="flex items-center justify-between mt-2">
                  <Button variant="ghost" size="sm" className="text-xs" data-testid="button-attach-file">
                    <Paperclip className="w-3 h-3 mr-1" />
                    Attach
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => createCommentMutation.mutate()}
                    disabled={!newComment.trim() || createCommentMutation.isPending}
                    data-testid="button-post-comment"
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
