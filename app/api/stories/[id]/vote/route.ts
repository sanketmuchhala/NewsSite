
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { vote_type } = await request.json();
    const storyId = parseInt(params.id);
    
    // Get user's IP address for voting tracking
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
    
    if (!['upvote', 'downvote'].includes(vote_type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid vote type' 
      }, { status: 400 });
    }
    
    // Check if user has already voted
    const existingVote = await sql`
      SELECT vote_type FROM story_votes 
      WHERE story_id = ${storyId} AND ip_address = ${ipAddress}
    `;
    
    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0].vote_type;
      
      if (currentVote === vote_type) {
        // Remove vote if clicking the same vote type
        await sql`
          DELETE FROM story_votes 
          WHERE story_id = ${storyId} AND ip_address = ${ipAddress}
        `;
        
        // Update story vote counts
        if (vote_type === 'upvote') {
          await sql`
            UPDATE news_stories 
            SET upvotes = GREATEST(upvotes - 1, 0)
            WHERE id = ${storyId}
          `;
        } else {
          await sql`
            UPDATE news_stories 
            SET downvotes = GREATEST(downvotes - 1, 0)
            WHERE id = ${storyId}
          `;
        }
      } else {
        // Change vote type
        await sql`
          UPDATE story_votes 
          SET vote_type = ${vote_type}, created_at = CURRENT_TIMESTAMP
          WHERE story_id = ${storyId} AND ip_address = ${ipAddress}
        `;
        
        // Update story vote counts (remove old vote, add new vote)
        if (vote_type === 'upvote') {
          await sql`
            UPDATE news_stories 
            SET upvotes = upvotes + 1, downvotes = GREATEST(downvotes - 1, 0)
            WHERE id = ${storyId}
          `;
        } else {
          await sql`
            UPDATE news_stories 
            SET downvotes = downvotes + 1, upvotes = GREATEST(upvotes - 1, 0)
            WHERE id = ${storyId}
          `;
        }
      }
    } else {
      // Add new vote
      await sql`
        INSERT INTO story_votes (story_id, ip_address, vote_type)
        VALUES (${storyId}, ${ipAddress}, ${vote_type})
      `;
      
      // Update story vote counts
      if (vote_type === 'upvote') {
        await sql`
          UPDATE news_stories 
          SET upvotes = upvotes + 1
          WHERE id = ${storyId}
        `;
      } else {
        await sql`
          UPDATE news_stories 
          SET downvotes = downvotes + 1
          WHERE id = ${storyId}
        `;
      }
    }
    
    // Get updated vote counts
    const result = await sql`
      SELECT upvotes, downvotes FROM news_stories 
      WHERE id = ${storyId}
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Story not found' 
      }, { status: 404 });
    }
    
    const story = result.rows[0];
    
    return NextResponse.json({
      success: true,
      data: {
        upvotes: story.upvotes,
        downvotes: story.downvotes,
        userVote: vote_type
      }
    });
    
  } catch (error) {
    console.error('Voting error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
